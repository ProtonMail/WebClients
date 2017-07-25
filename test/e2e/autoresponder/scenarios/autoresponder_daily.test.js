module.exports = () => {

    const autoresponder = require('../autoresponder.po');
    const { isTrue, isFalse, assert, assertUrl } = require('../../../e2e.utils/assertions');
    const logout = require('../../logout/logout.po');
    const loginPage = require('../../login/login.po')();

    const message = require('../../message/message.po');
    const composer = require('../../composer/composer.po')();


    describe('autoresponder daily', () => {

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
                .then(() => autoresponder.setDuration(autoresponder.DAILY))
                .then(() => autoresponder.getDuration())
                .then(assert(autoresponder.DAILY));
        });
        it('should be possible to set the enabled days', () => {
            browser.waitForAngular()
                .then(() => autoresponder.setEnabledDays([1, 2, 4, 5]))
                .then(() => autoresponder.getEnabledDays())
                .then(assert([1, 2, 4, 5]));
        })
        it('should be possible to set the startTime', () => {
            browser.waitForAngular()
                .then(() => autoresponder.setStartTime('12:00 AM'))
                .then(() => autoresponder.getStartTime())
                .then(assert('12:00 AM'));
        });

        it('should be possible to set the endTime', () => {
            browser.waitForAngular()
                .then(() => autoresponder.setEndTime('11:30 PM'))
                .then(() => autoresponder.getEndTime())
                .then(assert('11:30 PM'));
        });

        it('should be possible to set the Message', () => {
            browser.waitForAngular()
                .then(() => autoresponder.setMessage('<div>Hello how daily are you?<br></div><div>Bye!<br></div>'))
                .then(() => autoresponder.getMessage())
                .then(assert('<div>Hello how daily are you?<br></div><div>Bye!<br></div>'));
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
                .then(assert(autoresponder.DAILY))
                .then(() => autoresponder.getEnabledDays())
                .then(assert([1, 2, 4, 5]))
                .then(() => autoresponder.getStartTime())
                .then(assert('12:00 AM'))
                .then(() => autoresponder.getEndTime())
                .then(assert('11:30 PM'))
                .then(() => autoresponder.getMessage())
                .then(assert('<div>Hello how  daily are you?<br></div><div>Bye!<br></div>'))
                .then(() => autoresponder.getSubjectPrefix())
                .then(assert('Automatic reply'));
        });

    });
};
