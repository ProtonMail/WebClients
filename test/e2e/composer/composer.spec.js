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

  it('should create a new message', () => {
  })

  it('should add a recepient', () => {
  })

  it('should add a subject', () => {
  })

  it('should fill the content', () => {
  })

  it('should send the message', () => {
  })

  it('should hide the composer', () => {
  })

  it('should add a new conversation', () => {
  })


});