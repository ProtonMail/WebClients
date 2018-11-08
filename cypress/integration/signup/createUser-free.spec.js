const modalTest = require('../../support/helpers/modals.cy');
const wizardTuto = require('../../support/helpers/wizardTuto.cy');
const cardForm = require('../../support/helpers/cardForm.cy');
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

describe('Create a free user', () => {
    const USERNAME = init('free');

    before(() => {
        cy.visit(Cypress.env('server') + '/create/new');
        cy.url().should('include', '/create/new');
    });

    commonSpecs(USERNAME, { confirmModal, welcomeModal }, true);

    it('should create a user via donation', () => {
        cy.get('[name="donationForm"]').should('not.be.visible');

        cy.get('.humanVerification-block-donation .signup-radio-label').click();
        cy.get('[name="donationForm"]').should('be.visible');

        cardForm('donation').defaultForm();

        cy.get('.donationForm-btn-submit').click();

        cy.wait(3000);
        cy.get('.signUpProcess-step-1').should('not.be.visible');
        cy.get('.signUpProcess-step-2').should('not.be.visible');
        cy.get('.signUpProcess-step-3').should('not.be.visible');
        cy.get('.signUpProcess-step-4').should('not.be.visible');
        cy.get('.signUpProcess-step-5').should('be.visible');

        cy.url({ timeout: 20000 }).should('include', '/inbox');

        wizardTuto.isOpen(false);

        welcomeModal.isOpen();
        welcomeModal.selector('#displayName').should('have.value', USERNAME);
        welcomeModal.selector('#displayName').clear();
        welcomeModal.selector('#displayName').type('polo');
        welcomeModal.submit();

        cy.get('.navigationUser-link .navigation-title').contains('polo');

        wizardTuto.isOpen();
        wizardTuto.close();
    });
});
