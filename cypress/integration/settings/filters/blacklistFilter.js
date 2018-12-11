const test = require('../../../support/helpers/loginHelper');
const addressFilterActions = require('../../../support/helpers/filters/addressFilterActions');
const blacklistFilter = addressFilterActions('Blacklist');

const beforeActions = () => {
    cy.visit(`${Cypress.env('server')}filters`);
    cy.url().should('include', '/filters');
    cy.get('.settingsLabels-title-spam');
    cy.get('#pm_loading').should('be.hidden');
    blacklistFilter.clearFilter();
};

const afterActions = () => {
    blacklistFilter.clearFilter();
};

test(
    'Blacklist',
    () => require('../../../fixtures/settings/filters/blacklistFilter.spec'),
    beforeActions,
    afterActions
);
