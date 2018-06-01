const execSync = require('child_process').execSync;
const config = require('./config.js');

const helpers = {
  findRecorderImages() {
    const activeContainers = execSync('docker ps').toString().split('\n');

    // Find video recorders
    const recorderContainerNames = activeContainers
      .filter(line => line.includes(config.videoRecorderImageName))
      .map(line => line.match(/[^\s]+$/)[0]);
    return recorderContainerNames;
  },


  runIfVideoEnabled(browser, cb) {
    const { enableVNC, enableVideo } = browser.desiredCapabilities;
    if (enableVNC && enableVideo) {
      cb();
    }
  },

  generateFilename(browser, test) {
    const { browserName } = browser.desiredCapabilities;

    const timestamp = new Date().toLocaleString('iso', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).replace(/[ ]/g, '--').replace(':', '-');

    const filename = encodeURIComponent(
      `${
        test.fullName.replace(/\s+/g, '-')
      }-${browserName}-${timestamp}`.replace(/[/]/g, '__')
    ).replace(/%../, '.');

    return filename;
  },
};


module.exports = helpers;
