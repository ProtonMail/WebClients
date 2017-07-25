
module.exports = () => {
    const autoresponder = require('../autoresponder.po');
    const { isTrue, isFalse, assert, assertUrl } = require('../../../e2e.utils/assertions');
    const logout = require('../../logout/logout.po');
    const loginPage = require('../../login/login.po')();

    const message = require('../../message/message.po');
    const composer = require('../../composer/composer.po')();


    describe('autoresponder weekly', () => {

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
                .then(() => autoresponder.setDuration(autoresponder.WEEKLY))
                .then(() => autoresponder.getDuration())
                .then(assert(autoresponder.WEEKLY));
        });
        it('should be possible to set the startTime', () => {
            browser.waitForAngular()
                .then(() => autoresponder.setStartWeekday(1))
                .then(() => autoresponder.getStartWeekday())
                .then(assert(1))
                .then(() => autoresponder.setStartTime('3:30 AM'))
                .then(() => autoresponder.getStartTime())
                .then(assert('3:30 AM'));
        });

        it('should be possible to set the endTime', () => {
            browser.waitForAngular()
                .then(() => autoresponder.setEndWeekday(5))
                .then(() => autoresponder.getEndWeekday())
                .then(assert(5))
                .then(() => autoresponder.setEndTime('4:20 AM'))
                .then(() => autoresponder.getEndTime())
                .then(assert('4:20 AM'));
        });

        it('should be possible to set the Message', () => {
            browser.waitForAngular()
                .then(() => autoresponder.setMessage('<div>Hello how weekly are you?<br></div><div>Bye!<br></div>'))
                .then(() => autoresponder.getMessage())
                .then(assert('<div>Hello how weekly are you?<br></div><div>Bye!<br></div>'));
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
                .then(assert(autoresponder.WEEKLY))
                .then(() => autoresponder.getStartWeekday())
                .then(assert(1))
                .then(() => autoresponder.getStartTime())
                .then(assert('3:30 AM'))
                .then(() => autoresponder.getEndWeekday())
                .then(assert(5))
                .then(() => autoresponder.getEndTime())
                .then(assert('4:20 AM'))
                .then(() => autoresponder.getMessage())
                .then(assert('<div>Hello how weekly are you?<br></div><div>Bye!<br></div>'))
                .then(() => autoresponder.getSubjectPrefix())
                .then(assert('Automatic reply'));
        });

    });
};
