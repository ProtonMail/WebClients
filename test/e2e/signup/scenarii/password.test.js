const { isTrue, isFalse, isLength, contains, assert } = require('../../../e2e.utils/assertions');

module.exports = (utils) => {

    const PASSWORD = `proton${Date.now()}`;
    const errorsPass = utils.getErrors('password');
    const errorsConfirm = utils.getErrors('confirmPassword');
    const togglePass = utils.toggle('password');
    const toggleConfirm = utils.toggle('confirmPassword');

    describe('Password', () => {

        describe('1st set only', () => {

            it('should not display an error', () => {
                utils.fillInput('password', PASSWORD)
                    .then(() => browser.sleep(100))
                    .then(() => errorsPass.isVisible())
                    .then(isFalse);
            });

            it('should display an error if the field is now empty', () => {
                utils.fillInput('password', '')
                    .then(() => browser.sleep(100))
                    .then(() => errorsPass.isVisible())
                    .then(isTrue);
            });

            it('should display 1 error', () => {
                errorsPass.getMessage()
                    .then(isLength(1));
            });

            it('should say the field is required', () => {
                errorsPass.getMessage()
                    .then(contains((t) => t === 'Field required'));
            });

        });

        describe('2sd set only', () => {
            it('should not display an error', () => {
                utils.fillInput('confirmPassword', PASSWORD)
                    .then(() => browser.sleep(100))
                    .then(() => errorsConfirm.isVisible())
                    .then(isFalse);
            });

            it('should display an error for the password', () => {
                errorsPass.isVisible()
                    .then(isTrue);
            });

            it('should display an error if the field is now empty', () => {
                utils.fillInput('confirmPassword', '')
                    .then(() => browser.sleep(100))
                    .then(() => errorsConfirm.isVisible())
                    .then(isTrue);
            });

            it('should display 1 error', () => {
                errorsConfirm.getMessage()
                    .then(isLength(1));
            });

            it('should say the field is required', () => {
                errorsConfirm.getMessage()
                    .then(contains((t) => t === 'Field required'));
            });
        });

        describe('Different passwords', () => {

            it('should display an error', () => {
                utils.fillInput('password', PASSWORD)
                    .then(() => utils.fillInput('confirmPassword', 123))
                    .then(() => browser.sleep(100))
                    .then(() => errorsConfirm.isVisible())
                    .then(isTrue);
            });

            it('should not display an error for the password', () => {
                errorsPass.isVisible()
                    .then(isFalse);
            });

            it('should display 1 error', () => {
                errorsConfirm.getMessage()
                    .then(isLength(1));
            });

            it('should say the field is required', () => {
                errorsConfirm.getMessage()
                    .then(contains((t) => t === 'Passwords do not match'));
            });
        });

        describe('Same passwords', () => {

            it('should not display an error', () => {
                utils.fillInput('password', PASSWORD)
                    .then(() => utils.fillInput('confirmPassword', PASSWORD))
                    .then(() => browser.sleep(100))
                    .then(() => errorsConfirm.isVisible())
                    .then(isFalse);
            });

            it('should not display an error for the password', () => {
                errorsPass.isVisible()
                    .then(isFalse);
            });

        });

        describe('toggle password', () => {

            it('should change the label to Hide', () => {
                togglePass.click()
                    .then(() => browser.sleep(300))
                    .then(() => togglePass.label())
                    .then(assert('Hide'));
            });

            it('should change the label back to Show', () => {
                togglePass.click()
                    .then(() => browser.sleep(300))
                    .then(() => togglePass.label())
                    .then(assert('Show'));
            });

        });

        describe('toggle confirm password', () => {

            it('should change the label to Hide', () => {
                toggleConfirm.click()
                    .then(() => browser.sleep(300))
                    .then(() => toggleConfirm.label())
                    .then(assert('Hide'));
            });

            it('should change the label back to Show', () => {
                toggleConfirm.click()
                    .then(() => browser.sleep(300))
                    .then(() => toggleConfirm.label())
                    .then(assert('Show'));
            });

        });

    });
};
