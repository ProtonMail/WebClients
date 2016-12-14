const loginPage = require('./login.po')();
const { isTrue } = require('../../e2e.utils/assertions');

describe('Login tests', () => {

    it('should log in', () => {
        browser.ignoreSynchronization = true;
        browser.get('http://localhost:8080/login');
        browser.waitForAngular();

        loginPage.fill('username', browser.params.login);
        loginPage.fill('password', browser.params.password1);
        loginPage.submit();

        browser.wait(() => {
            return browser.getCurrentUrl().then((url) => {
                return url.indexOf('/login/unlock') !== -1;
            });
        }, 10000)
        .then(isTrue);
    });
});
