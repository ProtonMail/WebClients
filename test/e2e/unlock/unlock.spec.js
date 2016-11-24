var UnlockPage = require('./unlock.po.js');

describe('Unlock tests', function() {
    var unlockPage = new UnlockPage();

    browser.ignoreSynchronization = true;


    it('should unlock', function() {
        expect(unlockPage.password).toBeDefined();
        expect(unlockPage.button).toBeDefined();

        unlockPage.password.sendKeys(browser.params.password2);
        expect(unlockPage.password.getAttribute('value')).toBe(browser.params.password2);

        unlockPage.button.click();
        browser.wait(function() {
            return browser.getCurrentUrl().then(function(url) {
                return url.indexOf('/inbox') !== -1;
            });
        }, 10000)
        .then(function(result) {
            expect(result).toBe(true);
        });
    });
});
