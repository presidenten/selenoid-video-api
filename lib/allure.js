const reporter = require('wdio-allure-reporter');

const path = require('path');
const fs = require('fs');

const helpers = require('./helpers.js');

const allureReportDir = './e2e/results/allure-raw';
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
  finalizeReport() {
    // The video files should be saved by now.
    // Move them to the report instead of the placeholdes.
    fs
      .readdirSync(allureReportDir)
      .filter(line=>line.includes('.mp4'))
      .map(filename => allureReportDir + '/' + filename)
      .forEach((filepath) => {
        const videoFilePath = fs.readFileSync(filepath).toString(); // Contents of placeholder file is real video path
        fs.renameSync(videoFilePath, filepath);                     // Move video to placeholder
      });

    // Make report pretty by moving attachments from final step to test body
    fs
      .readdirSync(allureReportDir)
      .filter(line=>line.includes('.xml'))
      .map(filename => allureReportDir + '/' + filename)
      .forEach((filePath) => {
        let file = fs.readFileSync(filePath).toString();
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
