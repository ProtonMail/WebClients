const modal = require('../../../e2e.utils/modal');
const { isTrue, isFalse, assert } = require('../../../e2e.utils/assertions');

module.exports = (utils) => {


    describe('submit', () => {

        const generateKeysStep = utils.steps(2);
        const areYouHumanStep = utils.steps(3);

        it('should not display a modal', () => {
            modal.isVisible()
            .then(isFalse);
        });

        describe('Without a recovery email', () => {

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

            it('should redirect us on confirm', () => {
                modal.confirm()
                    .then(() => browser.sleep(100))
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
};
