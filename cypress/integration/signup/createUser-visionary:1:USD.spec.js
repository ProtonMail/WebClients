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

describe('Create a user: visionary:1:USD', () => {
    const USERNAME = init('visionary:1:USD');

    before(() => {
        cy.visit(Cypress.env('server') + '/create/new?plan=visionary&billing=1&currency=USD');
        cy.url().should('include', '/create/new?plan=visionary&billing=1&currency=USD');
    });

    commonSpecs(USERNAME, { confirmModal, welcomeModal });

    it('should create a user via payment', () => {
        cy.get('.signupPayForm-feature-plus').should('not.be.visible');
        cy.get('.signupPayForm-feature-visionary').should('be.visible');

        cy.get('.signupPayForm-selection-annually').should('not.be.visible');
        cy.get('.signupPayForm-selection-monthly').should('be.visible');

        cy.get('.signupPayForm-view-features').should('not.be.visible');
        cy.get('.signupPayForm-btn-features').click();
        cy.get('.signupPayForm-view-features').should('be.visible');

        cy.get('.print tr:last-of-type strong').contains('$');

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
