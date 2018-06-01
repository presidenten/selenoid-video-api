const ip = require('ip');

const allure = require('./lib/allure.js');
const video = require('./lib/video.js');
const config = require('./lib/config.js');
const helpers = require('./lib/helpers.js');


const wdio = {
  /**
   *  Get ready for tests
   *  - find local ip
   *  - Init video interface
   */
  before(browser) {
    browser.globals = browser.globals || {};
    browser.globals.ip = ip.address(); // Used by tests since we run webserver on local machine, feel free to override

    helpers.runIfVideoEnabled(browser, () => {
      video.init(browser);
    });
  },

  /**
   * Start recording before each test
   * Pause a short while to get nice video
   */
  beforeTest(browser, test, { size, framerate, codec }) {
    // Generate filename for screenshots and video
    browser.globals.currentRecordingName = helpers.generateFilename(browser, test);

    helpers.runIfVideoEnabled(browser, () => {
      video.startRecording({
        browser,
        size,
        framerate,
        codec,
      });

      browser.pause(config.videoMinTime);
    });
  },

  /**
   * Stop recording after each test
   */
  afterTest(browser, test, outputDir) {
    helpers.runIfVideoEnabled(browser, () => {
      video.stopRecording({
          browser: browser,
          save: !test.passed || config.saveAllVideos,
      });
    });

    if (config.usingAllure) {
      allure.addAttachments(browser, test, outputDir);
    }
  },

  /**
   * Close video recorder after tests
   */
  after(browser) {
    helpers.runIfVideoEnabled(browser, () => {
      video.close(browser.globals.clientIp);
    });
  },

  /**
   * Finalize report if using allure
   */
  onComplete() {
    if (config.usingAllure) {
      allure.finalizeReport();
    }
  },
};


module.exports = {
  getWdioHooks({ usingAllure=false, saveAllVideos=false, waitForVNCTime=2000, videoMinTime=500 }) {
    config.usingAllure = usingAllure;
    config.saveAllVideos = saveAllVideos;
    config.waitForVNCTime = waitForVNCTime;
    config.videoMinTime = videoMinTime;

    return wdio;
  },
  video,
  config,
}
