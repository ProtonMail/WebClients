const webapp = require('../../e2e.utils/webapp');
const { isTrue, isFalse, contains, assert } = require('../../e2e.utils/assertions');
const utils = require('./signup.po')();

const USERNAME = `proton${Date.now()}`;

describe('Create an account', () => {

    it('should load the e2e label', () => {
        webapp.openState('create/new')
            .then(isTrue);
        browser.sleep(2000);
    });

    describe('Username', () => {
        const errors = utils.getErrors('username');
        describe('Available', () => {

            it('should check if it is available', () => {
                utils.fillInput('username', USERNAME)
                    .then(() => utils.usernameMsg())
                    .then(assert('Checking username'))
                    .then(() => browser.sleep(2000));

            });

            it('should be available', () => {
                utils.usernameMsg()
                    .then(assert('Username available'));
            });

            it('should not dislay an error', () => {
                errors.isVisible()
                    .then(isFalse);
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

            it('should not be available', () => {
                errors.getMessage()
                    .then(contains((t) => t === 'Username already taken'));
            });

        });
    });


    describe('Password', () => {
        describe('1st set only', () => {

        });

        describe('2sd set only', () => {

        });

        describe('Different passwords', () => {

        });

        describe('Same passwords', () => {

        });

    });

    describe('Recovery', () => {
        describe('Invalid email', () => {

        });

        describe('Same as configured', () => {

        });

    });


});
