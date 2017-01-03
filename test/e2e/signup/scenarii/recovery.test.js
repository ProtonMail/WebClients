const { isTrue, isFalse, isLength, contains } = require('../../../e2e.utils/assertions');

module.exports = (utils) => {

    const errors = utils.getErrors('recoveryEmail');

    describe('Recovery', () => {

        describe('Invalid email', () => {

            it('should display an error', () => {
                utils.fillInput('recoveryEmail', 'monique')
                    .then(() => browser.sleep(100))
                    .then(() => errors.isVisible())
                    .then(isTrue);
            });

            it('should display 1 error', () => {
                errors.getMessage()
                    .then(isLength(1));
            });

            it('should say the field is required', () => {
                errors.getMessage()
                    .then(contains((t) => t === 'Invalid recovery email.'));
            });
        });

        describe('Same as configured', () => {

            it('should display not display an error', () => {
                utils.fillInput('recoveryEmail', utils.getEmail())
                    .then(() => browser.sleep(100))
                    .then(() => errors.isVisible())
                    .then(isFalse);
            });
        });

        describe('Valid email', () => {

            it('should display not display an error', () => {
                utils.fillInput('recoveryEmail', `${browser.params.login}@protonmail.com`)
                    .then(() => browser.sleep(100))
                    .then(() => errors.isVisible())
                    .then(isFalse);
            });
        });

        describe('Valid email with a scope', () => {

            it('should display not display an error', () => {
                utils.fillInput('recoveryEmail', `${browser.params.login}+test@protonmail.com`)
                    .then(() => browser.sleep(100))
                    .then(() => errors.isVisible())
                    .then(isFalse);
            });
        });

    });
};
