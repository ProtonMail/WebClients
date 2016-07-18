module.exports = () => {

  const getNotification = () => element(by.css('.proton-notification-template'));

  const getModalButtons = () => ({
    cancel: element(by.id('cancelModalBtn')),
    confirm: element(by.id('confirmModalBtn'))
  });

  const navigate = () => element(by.css('[ui-sref="secured.contacts"]')).click();

  /**
   * Create scenario
   *   - Click add new contact
   *   - Fill inputs
   *   - Click submit
   *
   * If it's for a fake addition, click onto cancel
   * @param  {String}  options.name
   * @param  {String}  options.email
   * @param  {Boolean} isFakeAddition default false
   * @return {void}
   */
  const add = ({ name, email }, isFakeAddition = false) => {
    element(by.css('[ng-click="addContact()"]')).click();

    element(by.id('contactName')).sendKeys(name);
    browser.sleep(100);
    element(by.id('contactEmail')).sendKeys(email);

    const btn = isFakeAddition ? 'cancelNewContact' : 'addNewContact';
    element(by.id(btn)).click();
    return browser.sleep(1000);
  };

  const remove = (list) => {
    // Click remove last added item
    return list[list.length - 1].$('.btnAction-delete')
      .click()
      .then(() => browser.sleep(1000));
  };

  const removeAll = () => element(by.css('.deleteAll')).click();

  const getModalMessage = () => element(by.css('.modal-body div')).getText();
  const getContactList = (shouldBeEmpty = false) => {
    const $table = element(by.css('.contactWrapper'));
    return !shouldBeEmpty ? $table.$$('tr[ng-repeat]') : $table;
  };

  const getAlert = () => element(by.css('.alert-info span'));

  return {
    navigate,
    add, remove, removeAll,
    getAlert, getContactList, getModalMessage, getModalButtons, getNotification
  };
};
