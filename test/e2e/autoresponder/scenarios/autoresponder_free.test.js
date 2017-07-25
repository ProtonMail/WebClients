
module.exports = () => {

    const autoresponder = require('../autoresponder.po');
    const { isTrue, isFalse, assert, assertUrl } = require('../../../e2e.utils/assertions');
    const logout = require('../../logout/logout.po');
    const loginPage = require('../../login/login.po')();

    const message = require('../../message/message.po');
    const composer = require('../../composer/composer.po')();


    it('should navigate to disabled autoresponder', () => {
        browser.waitForAngular()
            .then(() => autoresponder.navigate())
            .then(() => {
                expect(browser.getCurrentUrl()).toContain('/autoresponder');
                return autoresponder.canConfigure();
            }).then(isFalse);
    });

};
