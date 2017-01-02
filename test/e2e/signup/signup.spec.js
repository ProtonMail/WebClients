const webapp = require('../../e2e.utils/webapp');
const { isTrue, assert } = require('../../e2e.utils/assertions');
const utils = require('./signup.po')();

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
                utils.fillInput('username', 'monique')
                    .then(() => browser.sleep(100))
                    .then(() => utils.usernameMsg())
                    .then(assert('Checking username'));
            });

        });

        describe('Non available', () => {

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
