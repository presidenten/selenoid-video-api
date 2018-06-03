
describe('User interactions', () => {
  beforeEach(() => {
    browser.url('http://www.seleniumeasy.com/test/');
  });

  it('should be able edit input', () => {
    browser.click('#btn_basic_example');

    browser.waitForExist('.list-group .list-group-item');
    browser.pause(300);
    browser.click('.list-group .list-group-item');

    browser.waitForExist('#get-input');
    browser.setValue('#get-input input', 'Presidenten');
    browser.click('#get-input button');

    let name = $('#user-message #display').getText();

    expect(name).toBe('Presidenten');
  });


  it('should be able to move slider', () => {
    browser.click('#btn_basic_example');

    browser.waitForExist('.list-group .list-group-item');
    browser.pause(300);
    browser.click('#advanced_example');
    browser.waitForExist('.list-group .list-group-item');
    browser.pause(300);

    browser.click('.list-group-item[href^="./drag-drop-range"]');

    browser.waitForExist('#slider1');
    browser.pause(300);

    const sliderPos = browser.getLocation('#slider1 input');

    // browser.moveTo('#slider1 input', 10, 10);
    // browser.buttonDown(0);
    // browser.moveTo('#slider1 input', 100, 10);
    // browser.buttonUp(0);

    browser.leftClick('#slider1 input', 10, 10);
    browser.leftClick('#slider1 input', 100, 10);

    let range = $('#slider1 #range').getText();
    expect(range).toBe(30);
  });


  it('should be able to multi-select in dropdown', () => {
    browser.click('#btn_basic_example');

    browser.waitForExist('.list-group .list-group-item');
    browser.pause(300);
    browser.click('.list-group-item[href^="./basic-select-dropdown"]');

    browser.waitForExist('#multi-select');
    browser.pause(300);

    const modifierKey = process.platform == 'darwin' ? 'Meta' : 'Control';
    browser.keys(modifierKey);
    browser.click('#multi-select option[value="Florida"]');
    browser.click('#multi-select option[value="Ohio"]');
    browser.click('#multi-select option[value="Texas"]');

    browser.click('#printAll');

    const values = $('.getall-selected').getText();

    expect(values.includes('Florida')).toBe(true);
    expect(values.includes('Ohio')).toBe(true);
    expect(values.includes('Texas')).toBe(true);
  });

});
