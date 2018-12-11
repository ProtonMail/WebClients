const addressFilterActions = require('../../../support/helpers/filters/addressFilterActions');
const filterAddress = require('../../../support/modals/filterAddressFormModal');

//Blacklist
const blacklistFilter = addressFilterActions('Blacklist');
const blacklistAddBtnSelector = '#blacklist * .pm_button.primary';
const blacklistFilterModal = filterAddress('Blacklist');

//Whitelist
const whitelistFilter = addressFilterActions('Whitelist');
const whitelistAddBtnSelector = '#whitelist * .pm_button.primary';
const whitelistFilterModal = filterAddress('Whitelist');

//Search
const searchSelector = '.search';

const addEmail = (email, addBtnSelector, modal) => {
    cy.get(addBtnSelector).click();
    modal.addEmail(email);
    modal.save(true);
};

const search = (keyword, clear = true) => {
    if (clear) {
        cy.get(searchSelector).clear();
    }
    cy.get(searchSelector).type(keyword);
};

describe('Search and move between spam filters', () => {
    let email1 = `${new Date().getTime()}testTestTestTest@pm.me`;
    let email2 = `${new Date().getTime()}autoTest@protonmail.com`;
    let email3 = `${new Date().getTime()}whiteListEntry@protonmail.ch`;
    let email4 = `${new Date().getTime()}anotherRandomEmail@protonmail.ch`;

    it('Check if both lists are empty', () => {
        blacklistFilter.isEmpty(true);
        whitelistFilter.isEmpty(true);
    });

    it('Add 2 new blacklist emails', () => {
        addEmail(email1, blacklistAddBtnSelector, blacklistFilterModal);
        addEmail(email2, blacklistAddBtnSelector, blacklistFilterModal);
        cy.wait(1000);
        blacklistFilter.containsEmail(email1);
        blacklistFilter.containsEmail(email2);
    });

    it('Search: blacklist only', () => {
        search('test');
        cy.wait(1000); //Wait for the results to load.
        blacklistFilter.containsEmail(email1);
        blacklistFilter.containsEmail(email2);
        whitelistFilter.isEmpty(true);
        blacklistFilter.isEmpty(false);

        search('sakjdhgjskgjhasgdjashgdhajsfdas');
        cy.wait(1000);
        blacklistFilter.isEmpty(true);
        whitelistFilter.isEmpty(true);

        search('protonmail.com');
        cy.wait(1000);
        blacklistFilter.containsEmail(email2);
        whitelistFilter.isEmpty(true);
        blacklistFilter.isEmpty(false);
    });

    it('Clear the blacklist emails, reset the search', () => {
        search(' ');
        blacklistFilter.clearFilter();
        blacklistFilter.isEmpty(true);
        whitelistFilter.isEmpty(true);
    });

    it('Add 2 new whitelist emails', () => {
        addEmail(email3, whitelistAddBtnSelector, whitelistFilterModal);
        addEmail(email4, whitelistAddBtnSelector, whitelistFilterModal);
        cy.wait(1000);
        whitelistFilter.containsEmail(email3);
        whitelistFilter.containsEmail(email4);
    });

    it('Search: whitelist only', () => {
        search('protonmail.ch');
        cy.wait(1000); //Wait for the results to load.
        whitelistFilter.containsEmail(email3);
        whitelistFilter.containsEmail(email4);
        whitelistFilter.isEmpty(false);
        blacklistFilter.isEmpty(true);

        search('AAAAAAAAAAAaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaA');
        cy.wait(1000);
        blacklistFilter.isEmpty(true);
        whitelistFilter.isEmpty(true);

        search('whiteListEntry');
        cy.wait(1000);
        whitelistFilter.containsEmail(email3);
        whitelistFilter.isEmpty(false);
        blacklistFilter.isEmpty(true);
    });

    it('Clear the both lists, reset the search', () => {
        search(' ');
        blacklistFilter.clearFilter();
        whitelistFilter.clearFilter();
        blacklistFilter.isEmpty(true);
        whitelistFilter.isEmpty(true);
    });

    it('Add emails to both lists', () => {
        addEmail(email1, blacklistAddBtnSelector, blacklistFilterModal);
        addEmail(email2, blacklistAddBtnSelector, blacklistFilterModal);
        addEmail(email3, whitelistAddBtnSelector, whitelistFilterModal);
        addEmail(email4, whitelistAddBtnSelector, whitelistFilterModal);
        cy.wait(1000);
        blacklistFilter.containsEmail(email1);
        blacklistFilter.containsEmail(email2);
        whitelistFilter.containsEmail(email3);
        whitelistFilter.containsEmail(email4);
    });

    it('Search: both lists', () => {
        search('protonmail');
        cy.wait(1000); //Wait for the results to load.
        blacklistFilter.containsEmail(email2);
        whitelistFilter.containsEmail(email3);
        whitelistFilter.containsEmail(email4);

        search('protonmail.ch');
        cy.wait(1000);
        whitelistFilter.containsEmail(email3);
        whitelistFilter.containsEmail(email4);
        whitelistFilter.isEmpty(false);
        blacklistFilter.isEmpty(true);

        search('pm.me');
        cy.wait(1000);
        blacklistFilter.containsEmail(email1);
        whitelistFilter.isEmpty(true);
        blacklistFilter.isEmpty(false);

        search('SPACESHIP!');
        cy.wait(1000);
        blacklistFilter.isEmpty(true);
        whitelistFilter.isEmpty(true);
    });

    it('Move between lists', () => {
        search(' '); //Reset the search
        cy.wait(2000);
        blacklistFilter.moveAll();
        cy.wait(1000);
        whitelistFilter.containsEmail(email1);
        whitelistFilter.containsEmail(email2);
        whitelistFilter.containsEmail(email3);
        whitelistFilter.containsEmail(email4);

        whitelistFilter.moveAll();
        cy.wait(1000);
        whitelistFilter.isEmpty(true);
        blacklistFilter.containsEmail(email1);
        blacklistFilter.containsEmail(email2);
        blacklistFilter.containsEmail(email3);
        blacklistFilter.containsEmail(email4);
    });
});
