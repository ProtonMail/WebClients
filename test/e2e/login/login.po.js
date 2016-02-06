var LoginPage = function() {
    var username = element(by.model('username'));
    var password = element(by.model('password'));
    var button = element(by.id('login_btn'));

    this.login = function() {
        username.sendKeys(browser.params.login);
        password.sendKeys(browser.params.password);
        button.click();
        browser.waitForAngular();
    };

    this.openModal = function() {
        // modal
    };

    this.closeModal = function() {
        // modal
    };
};

module.exports = LoginPage;
