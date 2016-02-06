var LoginPage = require('./login.po.js');

describe('Login tests', function() {
    var loginPage = new LoginPage();

    browser.ignoreSynchronization = true;

    it('should go to login', function() {
        browser.get('http://localhost:8080/login');
    });

    it('should open the modal', function() {

    });

    it('should close the modal', function() {

    });

    it('should log in', function() {
        loginPage.login();
    });
});
