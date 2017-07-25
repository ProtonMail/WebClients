
module.exports = () => {

    const autoresponder = require('../autoresponder.po');
    const { isTrue, isFalse, assert, assertUrl } = require('../../../e2e.utils/assertions');
    const logout = require('../../logout/logout.po');
    const loginPage = require('../../login/login.po')();

    const message = require('../../message/message.po');
    const composer = require('../../composer/composer.po')();


    describe('autoresponder fixed', () => {

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
                .then(() => autoresponder.setDuration(autoresponder.FIXED_INTERVAL))
                .then(() => autoresponder.getDuration())
                .then(assert(autoresponder.FIXED_INTERVAL));
        });
        it('should be possible to set the startTime', () => {
            browser.waitForAngular()
                .then(() => autoresponder.setStartDate((now.getDate() + 1) + '/' + now.getMonth() + '/' + now.getFullYear()))
                .then(() => autoresponder.getStartDate())
                .then(assert(('0' + (1 + now.getDate())).slice(-2) + '/' + ('0' + now.getMonth()).slice(-2) + '/' + now.getFullYear()))
                .then(() => autoresponder.setStartTime('2:50 PM'))
                .then(() => autoresponder.getStartTime())
                .then(assert('2:50 PM'));
        });

        it('should be possible to set the endTime', () => {
            browser.waitForAngular()
                .then(() => autoresponder.setEndDate((tomorrow.getDate() + 1) + '/' + tomorrow.getMonth() + '/' + tomorrow.getFullYear()))
                .then(() => autoresponder.getEndDate())
                .then(assert(('0' + (1 + tomorrow.getDate())).slice(-2) + '/' + ('0' + tomorrow.getMonth()).slice(-2) + '/' + tomorrow.getFullYear()))
                .then(() => autoresponder.setEndTime('10:30 PM'))
                .then(() => autoresponder.getEndTime())
                .then(assert('10:30 PM'));
        });

        it('should be possible to set the Message', () => {
            browser.waitForAngular()
                .then(() => autoresponder.setMessage('<div>Hello how fixed are you?<br></div><div>Bye!<br></div>'))
                .then(() => autoresponder.getMessage())
                .then(assert('<div>Hello how fixed are you?<br></div><div>Bye!<br></div>'));
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
                .then(assert(autoresponder.FIXED_INTERVAL))
                .then(() => autoresponder.getStartDate())
                .then(assert(('0' + (1 + now.getDate())).slice(-2) + '/' + ('0' + now.getMonth()).slice(-2) + '/' + now.getFullYear()))
                .then(() => autoresponder.getStartTime())
                .then(assert('2:50 PM'))
                .then(() => autoresponder.getEndDate())
                .then(assert(('0' + (1 + tomorrow.getDate())).slice(-2) + '/' + ('0' + tomorrow.getMonth()).slice(-2) + '/' + tomorrow.getFullYear()))
                .then(() => autoresponder.getEndTime())
                .then(assert('10:30 PM'))
                .then(() => autoresponder.getMessage())
                .then(assert('<div>Hello how fixed are you?<br></div><div>Bye!<br></div>'))
                .then(() => autoresponder.getSubjectPrefix())
                .then(assert('Automatic reply'));
        });

    });

};
