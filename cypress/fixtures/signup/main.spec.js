const modalTest = require('../../support/helpers/modals.cy');
const wizardTuto = require('../../support/helpers/wizardTuto.cy');
const cardForm = require('../../support/helpers/cardForm.cy');
const { init } = require('../../support/config/users');

const commonSpecs = require('./common.spec');

const confirmModal = modalTest({
    title: 'Warning',
    message:
        'Warning: You did not set a recovery email so account recovery is impossible if you forget your password. Proceed without recovery email?'
});
const welcomeModal = modalTest({
    type: 'welcomeModal',
    title: 'Welcome to ProtonMail'
});

function main({ key, url, tests }) {
    describe(`Create a user: ${key}`, () => {
        const USERNAME = init(key);

        before(() => {
            // Set time to not run in to the black friday modal.
            cy.clock(new Date(2018, 3, 14).getTime(), ['Date'], { log: true });
            cy.visit(Cypress.env('server') + url);
            cy.url().should('include', url);
        });

        commonSpecs(USERNAME, { confirmModal, welcomeModal });

        it('should create a user via payment', () => {
            tests.plans.forEach((name) => {
                cy.get('.signupPayForm-plan-name').contains(name);
            });
            cy.get('.signupPayForm-plan-billing').contains(tests.billing);
            cy.get('.signupPayForm-plan-price').contains(tests.price);

            cardForm().defaultForm();
            cy.get('.signupPayForm-btn-submit').click();

            cy.url({ timeout: 60000 }).should('include', '/inbox');

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

        it('should attach the correct subscription', () => {
            cy.get('[id="tour-settings"]').click();
            cy.url().should('include', '/account');

            cy.get('.navigationSettings-link[href="/dashboard"]').click();
            cy.url().should('include', '/dashboard');

            tests.plans.forEach((name) => {
                cy.get('.subscriptionSection-item-title').contains(name);
            });
            cy.get('.subscriptionSection-tbody-billing').contains(tests.price);
            cy.get('.subscriptionSection-tbody-billing').contains(tests.method);

            if (tests.couponCode) {
                cy.get('.overviewSection-couponCode').contains(tests.couponCode);
            }
        });
    });
}

module.exports = main;
