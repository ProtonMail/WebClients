const webapp = require('../../e2e.utils/webapp');
const { isTrue } = require('../../e2e.utils/assertions');
const utils = require('./signup.po')();
const loadSuite = (name) => require(`./scenarii/${name}.test`)(utils);

describe('Create an account', () => {

    const currentStep = utils.steps(1);

    it('should load the e2e label', () => {
        webapp.openState('create/new')
            .then(isTrue);
        browser.sleep(2000);
    });

    it('should display the step 1', () => {
        currentStep.isVisible()
            .then(isTrue);
    });

    it('should only display the step 1', () => {
        currentStep.othersHidden()
            .then(isTrue);
    });

    ['username', 'password', 'recovery']
        .forEach(loadSuite);

    const submit = loadSuite('submit');
    submit.withRecovery();

    it('should load the e2e label', () => {
        webapp.openState('create/new')
            .then(isTrue);
        browser.sleep(2000);
    });

    ['username', 'password', 'recovery']
        .forEach(loadSuite);
    submit.noRecovery();
});
