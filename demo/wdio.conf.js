const selenoidVideoApi = require('../index.js');

const rec = selenoidVideoApi.getWdioHooks({
  usingAllure: true,     // Update Allurereport with videos
  saveAllVideos: false,  // If true, also saves videos for successful test cases
  videoMinTime: 50,      // Min time for tests. Increase if you have very short tests
  screenshots: false,    // Save screenshots on failed tests
  removeSteps: true,    // Remove all steps, and only save video
});


const config = {
  // =================================
  // Hooks bound to selenoid-video-api
  // =================================
  before: function (capabilities, specs) {
    // Setup the browser window
    browser.windowHandlePosition({x: 0, y: 0});
    browser.windowHandleSize({width: 1320, height: 768});

    rec.before(browser);
  },
  beforeTest: function (test) {
    rec.beforeTest(browser, test, {
      size: '1320x768',
      framerate: 15,
    });
  },
  afterTest: function (test) {
    rec.afterTest(browser, test, config.outputDir);
  },
  onComplete: function(exitCode, config, capabilities) {
    rec.onComplete(config);
  },


  // ============
  // Capabilities
  // ============
  capabilities: [{
      maxInstances: 1,
      browserName: 'chrome',
      enableVideo: true,
      enableVNC: true,
  }],


  // ===============
  // Custom settings
  // ===============
  host: 'localhost',                            // Selenium host url
  //services: ['selenium-standalone'],
  specs: [
    './specs/**/*.e2e.js',                        // Which files to run
  ],
  outputDir: './e2e/results/',                  // Output dir for the report
  reporters: ['dot', 'allure'],                 // Reporters: Dot for terminal, allure for web
  reporterOptions: {
    allure: {
      outputDir: './e2e/results/allure-raw/',   // Output dir for raw report
    },
  },


  // ==================
  // Some nice defaults
  // ==================
  deprecationWarnings: false,
  maxInstances: 10,
  sync: true,
  logLevel: 'silent',
  coloredLogs: true,
  bail: 0,
  waitforTimeout: 10000,
  connectionRetryTimeout: 90000,
  connectionRetryCount: 3,
  framework: 'jasmine',
  jasmineNodeOpts: {
    defaultTimeoutInterval: 100000,
    expectationResultHandler: function(passed, assertion) {
    }
  },
};

module.exports = {
  config,
};

require("babel-core/register")({
  presets: ['es2015']
});

