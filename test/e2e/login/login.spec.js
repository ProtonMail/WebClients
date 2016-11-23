var LoginPage = require('./login.po.js');

describe('Login tests', function() {
    var loginPage = new LoginPage();

    beforeEach(function() {
        browser.ignoreSynchronization = true;
        browser.get('http://localhost:8080/login');
        browser.waitForAngular();
        browser.sleep(1000);
    });

    it('should go to login', function() {
        expect(browser.getCurrentUrl()).toContain('/login');
    });

    it('should open the help modal', function() {
        loginPage.openHelp();
    });

    it('should open the bug modal', function() {
        loginPage.openBug();
    });

    it('should go to signup page', function() {
        loginPage.signup();
    });

    it('should go to protonmail.com', function() {
        loginPage.back();
        expect(browser.getCurrentUrl()).toEqual('https://protonmail.com/');
    });

    it('should wrong login', function() {
        loginPage.login(browser.params.login, 'panda');
        expect(browser.getCurrentUrl()).toContain('/login');
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
