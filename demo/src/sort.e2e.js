describe('User list', () => {
  beforeEach(() => {
    browser.url('http://' + browser.globals.ip + ':8080');
  });

  it('should be able right default', () => {
    let name = $('.name').getText();
    expect(name).toBe('Johan');
  });

  it('should be able to sort ascending', () => {
    browser.click('.sort.ascending');
    let name = $('.name').getText();
    expect(name).toBe('Carl2');

  });

  it('should be able to sort descending', () => {
    browser.click('.sort.descending');
    let name = $('.name').getText();
    expect(name).toBe('Tobbe2');
  });
});

