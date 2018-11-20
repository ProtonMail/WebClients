const modalTest = require('../../support/helpers/modals.cy');
const paymentMethod = require('../../support/helpers/paymentMethod.cy');
const { init } = require('../../support/config/users');

const commonSpecs = require('../../fixtures/signup/common.spec');

const confirmModal = modalTest({
    title: 'Warning',
    message:
        'Warning: You did not set a recovery email so account recovery is impossible if you forget your password. Proceed without recovery email?'
});
const welcomeModal = modalTest({
    type: 'welcomeModal',
    title: 'Welcome to ProtonMail'
});

describe('Create a user: plus:12:CHF via paypal', () => {
    const USERNAME = init('plus:12:CHF');

    before(() => {
        cy.visit(Cypress.env('server') + '/create/new?plan=plus&billing=12&currency=CHF');
        cy.url().should('include', '/create/new?plan=plus&billing=12&currency=CHF');
    });

    commonSpecs(USERNAME, { confirmModal, welcomeModal });

    it('should create a user via payment', () => {
        cy.get('.signupPayForm-plan-name').contains('ProtonMail Plus');
        cy.get('.signupPayForm-plan-billing').contains('Annually');
        cy.get('.signupPayForm-plan-price').contains('48.00 CHF (4.00 CHF / month)');

        cy.get('.print tr:last-of-type strong').contains('CHF');

        paymentMethod('paypal');
        cy.get('.signupPayForm-btn-submit').should('not.be.visible');
    });
});
