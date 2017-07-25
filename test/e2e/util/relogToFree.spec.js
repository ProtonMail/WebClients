module.exports = () => {
    const autoresponder = require('../autoresponder/autoresponder.po');
    const { isTrue, isFalse, assert, assertUrl } = require('../../e2e.utils/assertions');
    const logout = require('../logout/logout.po');
    const loginPage = require('../login/login.po')();

    const message = require('../message/message.po');
    const composer = require('../composer/composer.po')();


    it('should logout', () => {

        logout()
            .then(() => browser.sleep(1000))
            .then(() => {
                expect(browser.getCurrentUrl()).toContain('/login');
            });
    });

    it('should log in', () => {
        browser.get('http://localhost:8080/login');
        browser.waitForAngular();

        loginPage.fill('username', browser.params.freeLogin);
        loginPage.fill('password', browser.params.freePassword1);
        loginPage.submit();

        browser.wait(() => {
            return browser.getCurrentUrl().then((url) => {
                return url.indexOf('/login/unlock') !== -1;
            });
        }, 10000)
            .then(isTrue);
    });

};
