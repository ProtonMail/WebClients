const test = require('../../../support/helpers/loginHelper');

const beforeActions = () => {
    cy.visit(`${Cypress.env('server')}appearance`);
    cy.url().should('include', '/appearance');
};

test(
    'Default composer size tests',
    () => require('../../../fixtures/settings/appearance/composer.spec'),
    beforeActions
);
