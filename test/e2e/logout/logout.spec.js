var LogoutPage = require('./logout.po.js');

describe('Logout tests', function() {
    var logoutPage = new LogoutPage();
    browser.ignoreSynchronization = true;

    beforeEach(function() {
        browser.sleep(browser.params.sleep);
    });

    it('should logout', function() {
        logoutPage.logout();
        expect(browser.getCurrentUrl()).toContain('/login');
    });
});
