const test = require('../../../support/helpers/loginHelper');

const addressFilterActions = require('../../../support/helpers/filters/addressFilterActions');

const beforeActions = () => {
    cy.visit(`${Cypress.env('server')}filters`);
    cy.url().should('include', '/filters');
    cy.get('.settingsLabels-title-spam');
    cy.get('#pm_loading').should('be.hidden');
    let whitelistFilter = addressFilterActions('Whitelist');
    whitelistFilter.clearFilter();
};

test('Whitelist', () => require('../../../fixtures/settings/filters/whitelistFilter.spec'), beforeActions);
