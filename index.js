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
  beforeTest(browser, test, { size, framerate, codec, pixelFormat }) {
    // Generate filename for screenshots and video
    browser.globals.currentRecordingName = helpers.generateFilename(browser, test);

    helpers.runIfVideoEnabled(browser, () => {
      video.startRecording({
        browser,
        size,
        framerate,
        codec,
        pixelFormat,
      });
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
   * Finalize report if using allure
   * Close all video recorders
   */
  onComplete(wdioConfig, shortenSeleniumUrls) {
    if (config.usingAllure) {
      allure.finalizeReport(wdioConfig, shortenSeleniumUrls);
    }

    video.closeAll();
  },
};


module.exports = {
  getWdioHooks({ usingAllure=true, saveAllVideos=false, videoMinTime=50, screenshots=false, removeSteps=false }) {
    config.usingAllure = usingAllure;
    config.saveAllVideos = saveAllVideos;
    config.videoMinTime = videoMinTime;
    config.screenshots = screenshots;
    config.removeSteps = removeSteps;

    return wdio;
  },
  video,
  config,
}
