var Contact = require('./contact.po.js');

describe('Contact tests', function() {
    browser.ignoreSynchronization = true;

    beforeEach(function() {
        browser.sleep(browser.params.sleep);
    });

    it('should be in contacts', function() {
        browser.setLocation('contacts');

    });
});
