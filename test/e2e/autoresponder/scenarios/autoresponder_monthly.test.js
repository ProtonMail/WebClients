
module.exports = () => {

    const autoresponder = require('../autoresponder.po');
    const { isTrue, isFalse, assert, assertUrl } = require('../../../e2e.utils/assertions');
    const logout = require('../../logout/logout.po');
    const loginPage = require('../../login/login.po')();

    const message = require('../../message/message.po');
    const composer = require('../../composer/composer.po')();


    describe('autoresponder monthly', () => {

        const now = new Date;
        const tomorrow = new Date;
        tomorrow.setDate(tomorrow.getDate() + 1);

        browser.ignoreSynchronization = true;
        it('should navigate to autoresponder', () => {
            browser.waitForAngular()
                .then(autoresponder.navigate)
                .then(() => {
                    expect(browser.getCurrentUrl()).toContain('/autoresponder');
                    return autoresponder.canConfigure();
                }).then(isTrue);
        });
        it('should be possible to enable the autoresponder', () => {
            browser.waitForAngular()
                .then(() => autoresponder.enable())
                .then(() => autoresponder.isEnabled())
                .then(isTrue);
        });
        it('should be possible to set the duration', () => {
            browser.waitForAngular()
                .then(() => autoresponder.setDuration(autoresponder.MONTHLY))
                .then(() => autoresponder.getDuration())
                .then(assert(autoresponder.MONTHLY));
        });
        it('should be possible to set the startTime', () => {
            browser.waitForAngular()
                .then(() => autoresponder.setStartMonthday(20))
                .then(() => autoresponder.getStartMonthday())
                .then(assert(20))
                .then(() => autoresponder.setStartTime('5:26 PM'))
                .then(() => autoresponder.getStartTime())
                .then(assert('5:26 PM'));
        });

        it('should be possible to set the endTime', () => {
            browser.waitForAngular()
                .then(() => autoresponder.setEndMonthday(1))
                .then(() => autoresponder.getEndMonthday())
                .then(assert(1))
                .then(() => autoresponder.setEndTime('8:23 PM'))
                .then(() => autoresponder.getEndTime())
                .then(assert('8:23 PM'));
        });

        it('should be possible to set the Message', () => {
            browser.waitForAngular()
                .then(() => autoresponder.setMessage('<div>Hello how monthly are you?<br></div><div>Bye!<br></div>'))
                .then(() => autoresponder.getMessage())
                .then(assert('<div>Hello how monthly are you?<br></div><div>Bye!<br></div>'));
        });

        it('should be possible to set the subject prefix', () => {
            browser.waitForAngular()
                .then(() => autoresponder.setSubjectPrefix('Automatic reply'))
                .then(() => autoresponder.getSubjectPrefix())
                .then(assert('Automatic reply'));

        });

        it('should be possible to save, refresh and retain the autoresponder', () => {
            browser.waitForAngular()
                .then(() => autoresponder.save(browser.params.password1))
                .then(() => browser.refresh())
                .then(() => browser.wait(() => autoresponder.isOpened(), 10000))
                .then(() => autoresponder.isEnabled())
                .then(isTrue)
                .then(() => autoresponder.getDuration())
                .then(assert(autoresponder.MONTHLY))
                .then(() => autoresponder.getStartMonthday())
                .then(assert(20))
                .then(() => autoresponder.getStartTime())
                .then(assert('5:26 PM'))
                .then(() => autoresponder.getEndMonthday())
                .then(assert(1))
                .then(() => autoresponder.getEndTime())
                .then(assert('8:23 PM'))
                .then(() => autoresponder.getMessage())
                .then(assert('<div>Hello how monthly are you?<br></div><div>Bye!<br></div>'))
                .then(() => autoresponder.getSubjectPrefix())
                .then(assert('Automatic reply'));
        });

    });

};
