const { isTrue, isFalse, isLength, contains, assert } = require('../../../e2e.utils/assertions');

module.exports = (utils) => {
    describe('Username', () => {
        const USERNAME = `proton${Date.now()}`;
        utils.saveEmail(`${USERNAME}@protonmail.com`);
        const errors = utils.getErrors('username');

        describe('Empty', () => {
            it('should  not check if it is available', () => {
                utils.fillInput('username', 'a')
                    .then(() => utils.fillInput('username', ''))
                    .then(() => browser.sleep(100))
                    .then(() => utils.usernameMsg())
                    .then(assert(''));
                browser.sleep(2000);
            });

            it('should dislay an error', () => {
                errors.isVisible()
                    .then(isTrue);
            });

            it('should display one message', () => {
                errors.getMessage()
                    .then(isLength(1));
            });

            it('should not be available', () => {
                errors.getMessage()
                    .then(contains((t) => t === 'Username required'));
            });

        });

        describe('Invalid', () => {
            it('should not check if it is available', () => {
                ['<', '>', '!', '+'].forEach((key) => {
                    utils.fillInput('username', key)
                        .then(() => browser.sleep(100))
                        .then(() => utils.usernameMsg())
                        .then(assert(''));
                });
                browser.sleep(2000);
            });

            it('should dislay an error', () => {
                errors.isVisible()
                    .then(isTrue);
            });

            it('should display one message', () => {
                errors.getMessage()
                    .then(isLength(1));
            });

            it('should not be available', () => {
                errors.getMessage()
                    .then(contains((t) => t === 'Username invalid'));
            });

        });

        describe('Non available', () => {

            it('should check if it is available', () => {
                utils.fillInput('username', browser.params.login)
                    .then(() => browser.sleep(100))
                    .then(() => utils.usernameMsg())
                    .then(assert('Checking username'));
                browser.sleep(2000);
            });

            it('should dislay an error', () => {
                errors.isVisible()
                    .then(isTrue);
            });

            it('should display one message', () => {
                errors.getMessage()
                    .then(isLength(1));
            });

            it('should not be available', () => {
                errors.getMessage()
                    .then(contains((t) => t === 'Username already taken'));
            });

        });

        describe('Available', () => {

            it('should check if it is available', () => {
                utils.fillInput('username', USERNAME)
                    .then(() => utils.usernameMsg())
                    .then(assert('Checking username'));

            });

            it('should be available', () => {
                browser.sleep(1000)
                    .then(() => utils.usernameMsg())
                    .then(assert('Username available'));
            });

            it('should not dislay an error', () => {
                errors.isVisible()
                    .then(isFalse);
            });

        });

    });
};
