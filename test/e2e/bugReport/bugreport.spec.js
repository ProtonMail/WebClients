const bugreport = require('./bugreport.po');
const modal = require('../../e2e.utils/modal');

describe('Bug report tests', () => {
  const page = bugreport();

  beforeEach(() => {
    page.open();
    browser.sleep(1000);
  });

  it('should open a modal', () => {
    expect(modal.buttons().confirm.isPresent()).toEqual(true)
  })

});