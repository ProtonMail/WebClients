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

describe('Create a user: plus:12:CHF', () => {
    const USERNAME = init('plus:12:CHF');

    before(() => {
        cy.visit(Cypress.env('server') + '/create/new?plan=plus&billing=12&currency=CHF');
        cy.url().should('include', '/create/new?plan=plus&billing=12&currency=CHF');
    });

    commonSpecs(USERNAME, { confirmModal, welcomeModal });

    it('should create a user via payment', () => {
        cy.get('.signupPayForm-feature-plus').should('be.visible');
        cy.get('.signupPayForm-feature-visionary').should('not.be.visible');

        cy.get('.signupPayForm-selection-annually').should('be.visible');
        cy.get('.signupPayForm-selection-monthly').should('not.be.visible');

        cy.get('.signupPayForm-view-features').should('not.be.visible');
        cy.get('.signupPayForm-btn-features').click();
        cy.get('.signupPayForm-view-features').should('be.visible');
        cy.get('.print tr:last-of-type strong').contains('CHF');

        cardForm().defaultForm();
        cy.get('.signupPayForm-btn-submit').click();

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
