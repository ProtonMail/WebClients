const composer = require('./composer.po');

describe('composer tests', () => {
  const editor = composer();

  beforeEach(() => {
    editor.open();
    browser.sleep(1000);
  });

  it('should open a the composer', () => {
    expect(editor.isOpened()).toEqual(true)
  })

});