const reporter = require('wdio-allure-reporter');

const path = require('path');
const fs = require('fs-extra');
const sleep = require('sleep');

const helpers = require('./helpers.js');

const homePath = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];

const allure = {
  addAttachments(browser, test, outputDir) {
    if (!test.passed) {
      const filename = browser.globals.currentRecordingName;
      const filePath = path.resolve(outputDir, `${filename}.png`);
      browser.saveScreenshot(filePath);

      helpers.runIfVideoEnabled(browser, () => {
        const videoPath = path.resolve(homePath, '.aerokube/selenoid/video', filename + '.mp4');
        reporter.createAttachment('Execution video', videoPath, 'video/mp4');
      });
    }
  },
  finalizeReport(wdioConfig, shortenSeleniumUrls=true) {
    allureReportDir = path.resolve(wdioConfig.outputDir, 'allure-raw');
    console.log('- Waiting for videos to render');

    fs
      .readdirSync(allureReportDir)
      .filter(line=>line.includes('.mp4'))
      .map(filename => allureReportDir + '/' + filename)
      .forEach((filepath) => {
        const videoFilePath = fs.readFileSync(filepath).toString(); // Contents of placeholder file is real video path
        const filename = videoFilePath.toString().match(/[^\/]*\.mp4$/)[0];

        // Wait for video files to render
        let fileStats = fs.statSync(videoFilePath);
        let lastSize = 0;
        let videoIsReady = false;
        do {
          fileStats = fs.statSync(videoFilePath);
          videoIsReady = fileStats.size > 48 && lastSize === fileStats.size;
          lastSize = fileStats.size > 48 ? fileStats.size : 0;
          sleep.msleep(100);
        } while (fileStats.size === 48 || !videoIsReady);

        fs.copySync(videoFilePath, path.resolve(wdioConfig.outputDir + filename));
        fs.renameSync(videoFilePath, filepath);                     // Move video to placeholder
      });

    // Make report pretty by moving attachments from final step to test body
    fs
      .readdirSync(allureReportDir)
      .filter(line=>line.includes('.xml'))
      .map(filename => allureReportDir + '/' + filename)
      .forEach((filePath) => {
        let file = fs.readFileSync(filePath).toString();

        const homeDirRegExp = new RegExp(homePath, 'g');
        file = file.replace(homeDirRegExp, '~');

        if(shortenSeleniumUrls) {
          const captureActionRegexp = /\/wd\/hub.*(\/\w+<\/)/g;
          file = file.replace(captureActionRegexp, '$1');
        }

        const faileStepToTestAttachmentsRegexp = new RegExp(
          '<step [^\/]*>(?:\n.*){3}' +                                          // Find test step
          '(<attachments>\n.*<attachment title=\'Screenshot\'(?:.*\n){1,2}.*' + // Followed by attachemts with screenshot
          '<\/attachments>)' +                                                  // Finalize capturegroup for step attachments
          '(?:\n.*){4}' +                                                       // Move outside test steps
          '<attachments\/>',                                                    // Make sure to end with empty test attachments
          'gm');                                                                // Modifier: global, multiline
        file = file.replace(faileStepToTestAttachmentsRegexp, '</steps>\n\t\t\t\t$1');
        fs.writeFileSync(filePath, file);
      });
  },
}

module.exports = allure;
