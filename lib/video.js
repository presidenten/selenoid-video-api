const exec = require('child_process').exec;
const execSync = require('child_process').execSync;

const axios = require('axios');

const config = require('./config.js');
const helpers = require('./helpers.js');

let recorderMappings = [];
let containerrecorderContainerNames = [];

// Video interface
const video = {
  /**
   * Init should be called when Selenoid has spawned all containers
   * It stores the browsers ips in `browser` and makes a map
   * over which recorder that belongs to each browser container.
   */
  init(browser, baseUrl) {
    var sessionId = browser.requestHandler.sessionID;

    // Find browser ip by comparing sessionID in selenoid status
    // (Can we do this in a smarter way?)
    axios.get('http://localhost:4444/status').then((response) => {
      var regexp = new RegExp(sessionId.replace('-', '\-') + '.*?\"ip\":\"([^\"]*)');
      browser.globals.clientIp = JSON.stringify(response.data).match(regexp)[1];
    });

    recorderContainerNames = helpers.findRecorderImages();

    const newRecorderMappings = recorderContainerNames
      .filter(name => !containerrecorderContainerNames.includes(name))
      .map((name) => {
        const browserIp = execSync(`docker exec ${name} env`)
          .toString()
          .split('\n')
          .filter(line => line.includes('BROWSER_PORT_4444_TCP_ADDR'))
          .map(line => line.split('=')[1])
          .pop();

        const ip = execSync(`docker inspect ${name}`)
          .toString()
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.match('\"IPAddress'))
          .map(line => line.split(':')[1]
                           .trim()
                           .replace(/\"|,/g, ''))
          .pop();

        return {
          name,       // Recorder container name
          ip,         // Recorder container ip (nice to have if we want rest-services)
          browserIp,  // Associated browser ip
        };
      });

    recorderMappings.push(...newRecorderMappings);
    containerrecorderContainerNames.push(...recorderContainerNames);

    // Sometimes Firefox needs extra time to get vnc running
    // (Can we do this in a smarter way?)
    browser.pause(config.waitForVNCTime);
  },

  /**
   * Start recording
   * Executes command in docker container
   */
  startRecording({ browser, size='1920x1080', framerate=15, codec='libx264', pixelFormat='yuv420p' }) {
    const { clientIp, currentRecordingName } = browser.globals;
    const recorder = recorderMappings.filter(recorder => recorder.browserIp === clientIp).pop();

    const ffmpegCMD = `ffmpeg -y `+
                      `-f x11grab `+
                      `-video_size ${size} ` +
                      `-r ${framerate} ` +
                      `-i browser:99 ` +
                      `-vcodec ${codec} ` +
                      `-pix_fmt ${pixelFormat} ` +
                      `"/data/${currentRecordingName}.mp4"`;

    exec(`docker exec ${recorder.name} sh -c '${ffmpegCMD}'`);
  },

  /**
   * Stop recording
   * Sends SIGINT to ffmpeg in docker container
   */
  stopRecording({ browser, save=true }) {
    const { clientIp, currentRecordingName } = browser.globals;
    const recorder = recorderMappings.filter(recorder => recorder.browserIp === clientIp).pop();

    // Send SIGINT to ffmpeg in container
    // Wrapped in try-block because it sometimes acts up for no reason even when it works
    try { execSync(`docker exec ${recorder.name} sh -c 'pkill -INT -f ffmpeg'`); } catch(e) {}

    if (!save) {
      // Remove video files when they are not wanted
      execSync(`docker exec ${recorder.name} sh -c 'rm /data/${currentRecordingName}.mp4'`);
    }
  },

  /**
   * Close docker container
   * Cleanup by killing all processes with SIGINT
   */
  closeAll() {
    helpers.findRecorderImages().forEach((name) => {
      execSync(`docker kill ${name}`)
    });
  },
};


// --- Start up ---
// Clean up old spawned video recorders that might be alive
helpers.findRecorderImages().forEach(name => { exec(`docker kill ${name}`) });


module.exports = video;
