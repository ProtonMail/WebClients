const buttons = () => ({
  cancel: element(by.id('cancelModalBtn')),
  confirm: element(by.id('confirmModalBtn'))
});

const message = () => element(by.css('.modal-body div')).getText();

module.exports = { buttons, message };