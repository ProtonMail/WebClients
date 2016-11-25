const logout = require('./logout.po');

describe('Logout tests', () => {
    browser.ignoreSynchronization = true;


    it('should logout', () => {

        logout()
            .then(() => browser.sleep(1000))
            .then(() => {
                expect(browser.getCurrentUrl()).toContain('/login');
            });
    });
});
