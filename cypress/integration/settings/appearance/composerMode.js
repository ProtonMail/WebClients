const test = require('../../../support/helpers/loginHelper');

const beforeActions = () => {
    cy.visit(`${Cypress.env('server')}appearance`);
    cy.url().should('include', '/appearance');
};

test('Composer mode tests', () => require('../../../fixtures/settings/appearance/composerMode.spec'), beforeActions);
