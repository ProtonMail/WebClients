var Unlock = require('./unlock.po.js');

describe('Unlock tests', function() {
    var unlock = new Unlock();

    browser.ignoreSynchronization = true;

    beforeEach(function() {
        browser.sleep(browser.params.sleep);
    });

    it('should unlock', function() {
        expect(unlock.password).toBeDefined();
        expect(unlock.button).toBeDefined();

        unlock.password.sendKeys(browser.params.password2);
        expect(unlock.password.getAttribute('value')).toBe(browser.params.password2);

        unlock.button.click();
        browser.waitForAngular();
    });
});
