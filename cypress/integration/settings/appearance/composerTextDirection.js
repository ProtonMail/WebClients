const test = require('../../../support/helpers/loginHelper');

const beforeActions = () => {
    cy.visit(`${Cypress.env('server')}appearance`);
    cy.url().should('include', '/appearance');
};

test(
    'Composer text direction tests',
    () => require('../../../fixtures/settings/appearance/composerTextDirection.spec'),
    beforeActions
);
