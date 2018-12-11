const test = require('../../../support/helpers/loginHelper');
const addressFilterActions = require('../../../support/helpers/filters/addressFilterActions');
const blacklistFilter = addressFilterActions('Blacklist');
const whitelistFilter = addressFilterActions('Whitelist');

const beforeActions = () => {
    cy.visit(`${Cypress.env('server')}filters`);
    cy.url().should('include', '/filters');
    cy.get('.settingsLabels-title-spam');
    cy.get('#pm_loading').should('be.hidden');
    blacklistFilter.clearFilter();
    whitelistFilter.clearFilter();
};

const afterActions = () => {
    blacklistFilter.clearFilter();
};

test(
    'Spam filter search & move',
    () => require('../../../fixtures/settings/filters/spamFilterSearch.spec'),
    beforeActions,
    afterActions
);
