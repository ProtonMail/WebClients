const modal = require('../../../e2e.utils/modal');
const { isTrue, isFalse, assert } = require('../../../e2e.utils/assertions');

module.exports = (utils) => {


    function noRecovery() {
        describe('submit without a recovery', () => {

            const formStep = utils.steps(1);
            const generateKeysStep = utils.steps(2);
            const areYouHumanStep = utils.steps(3);

            it('should not display a modal', () => {
                modal.isVisible()
                    .then(isFalse);
            });

            it('should display a modal', () => {
                utils.fillInput('recoveryEmail', '')
                    .then(() => browser.sleep(100))
                    .then(() => utils.create())
                    .then(() => browser.sleep(100))
                    .then(() => modal.isVisible())
                    .then(isTrue);
            });

            it('should be a warning modal', () => {
                modal.title()
                    .then(assert('Warning'));
            });

            it('should invite us to set a recovery email', () => {
                modal.read()
                    .then(assert('Warning: You did not set a recovery email so account recovery is impossible if you forget your password. Proceed without recovery email?'));
            });

            describe('Cancel', () => {

                it('should not redirect us', () => {
                    modal.cancel()
                        .then(() => browser.sleep(100))
                        .then(() => formStep.isVisible())
                        .then(isTrue)
                        .then(() => formStep.othersHidden())
                        .then(isTrue);
                });

                it('should not display a modal', () => {
                    modal.isVisible()
                        .then(isFalse);
                });

            });

            describe('Confirm', () => {

                it('should redirect us', () => {
                    utils.create()
                        .then(() => browser.sleep(100))
                        .then(() => modal.isVisible())
                        .then(isTrue)
                        .then(() => modal.confirm())
                        .then(() => browser.sleep(1000))
                        .then(() => generateKeysStep.isVisible())
                        .then(isTrue)
                        .then(() => generateKeysStep.othersHidden())
                        .then(isTrue);
                });

                it('should check if we are human', () => {
                    browser.sleep(10000)
                        .then(() => areYouHumanStep.isVisible())
                        .then(isTrue)
                        .then(() => areYouHumanStep.othersHidden())
                        .then(isTrue);
                });
            });
        });
    }

    function withRecovery() {
        describe('submit with a recovery', () => {

            const generateKeysStep = utils.steps(2);
            const areYouHumanStep = utils.steps(3);

            it('should not display a modal', () => {
                modal.isVisible()
                    .then(isFalse);
            });

            it('should redirect us', () => {
                utils.create()
                    .then(() => browser.sleep(1000))
                    .then(() => generateKeysStep.isVisible())
                    .then(isTrue)
                    .then(() => generateKeysStep.othersHidden())
                    .then(isTrue);
            });

            it('should check if we are human', () => {
                browser.sleep(10000)
                    .then(() => areYouHumanStep.isVisible())
                    .then(isTrue)
                    .then(() => areYouHumanStep.othersHidden())
                    .then(isTrue);
            });

        });
    }

    return {
        noRecovery,
        withRecovery
    };
};
