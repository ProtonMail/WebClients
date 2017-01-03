const webapp = require('../../e2e.utils/webapp');
const { isTrue, isFalse, isLength, contains, assert } = require('../../e2e.utils/assertions');
const utils = require('./signup.po')();


describe('Create an account', () => {

    it('should load the e2e label', () => {
        webapp.openState('create/new')
            .then(isTrue);
        browser.sleep(2000);
    });

    // require('./scenarii/username.test')(utils);
    require('./scenarii/password.test')(utils);

    describe('Recovery', () => {
        describe('Invalid email', () => {

        });

        describe('Same as configured', () => {

        });

    });


});
