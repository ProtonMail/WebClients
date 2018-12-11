const filterAddress = require('../../../support/modals/filterAddressFormModal');
const addressFilterActions = require('../../../support/helpers/filters/addressFilterActions');

describe('Whitelist spam filter', () => {
    let addBtnSelector = '#whitelist * .pm_button.primary';

    it('Add new whitelist email', () => {
        cy.get(addBtnSelector).click();
        let email = `${new Date().getTime()}whitelistTest@protonmail.com`;
        let whitelistModal = filterAddress('Whitelist');
        whitelistModal.isOpen();
        whitelistModal.title();
        whitelistModal.cancel();
        whitelistModal.addEmail(email);
        whitelistModal.save(true);
        let whitelistFIlter = addressFilterActions('Whitelist');
        whitelistFIlter.containsEmail(email);
    });

    it('Add random string as email', () => {
        cy.get(addBtnSelector).click();
        let email = 'a<>@pm.me';
        let whitelistModal = filterAddress('Whitelist');
        whitelistModal.isOpen();
        whitelistModal.title();
        whitelistModal.addEmail(email, true);
        whitelistModal.save();
        whitelistModal.cancel(true);
        whitelistModal.isOpen(false);
    });
});
