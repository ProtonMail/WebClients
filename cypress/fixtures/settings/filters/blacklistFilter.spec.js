const filterAddress = require('../../../support/modals/filterAddressFormModal');
const addressFilterActions = require('../../../support/helpers/filters/addressFilterActions');

describe('Blacklist spam filter', () => {
    const addBtnSelector = '#blacklist * .pm_button.primary';

    it('Add new blacklist email', () => {
        cy.get(addBtnSelector).click();
        let email = `${new Date().getTime()}blacklistTest@protonmail.com`;
        let blacklistModal = filterAddress('Blacklist');
        blacklistModal.isOpen();
        blacklistModal.title();
        blacklistModal.cancel();
        blacklistModal.addEmail(email);
        blacklistModal.save(true);
        let blacklistFilter = addressFilterActions('Blacklist');
        blacklistFilter.containsEmail(email);
    });

    it('Add random string as email', () => {
        cy.get(addBtnSelector).click();
        let email = 'a<>@pm.me';
        let blacklistModal = filterAddress('Blacklist');
        blacklistModal.isOpen();
        blacklistModal.title();
        blacklistModal.addEmail(email, true);
        blacklistModal.save();
        blacklistModal.cancel(true);
        blacklistModal.isOpen(false);
    });
});
