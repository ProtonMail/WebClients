var LoginPage = require('./login.po.js');

describe('Login tests', function() {
    var loginPage = new LoginPage();

    beforeEach(function() {
        browser.ignoreSynchronization = true;
        browser.get('http://localhost:8080/login');
        browser.waitForAngular();
        browser.sleep(1000);
    });
    it('should log in', function() {
        loginPage.login(browser.params.login, browser.params.password1);
        browser.wait(function() {
            return browser.getCurrentUrl().then(function(url) {
                return url.indexOf('/login/unlock') !== -1;
            });
        }, 10000)
        .then(function(result) {
            expect(result).toBe(true);
        });
    });
});
