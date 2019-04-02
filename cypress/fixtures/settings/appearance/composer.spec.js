const notification = require('../../../support/helpers/notification.cy');
const { helper } = require('../../../support/helpers/composerOptions.cy');

const composerHelper = helper();

function goTo(url) {
    cy.visit(`${Cypress.env('server')}${url}`);
    cy.url().should('include', `/${url}`);
}

describe('Composer size selector', () => {
    const popupSelector = 'img[src="assets/img/settings/pop.gif"]';
    const maximizedSelector = 'img[src="assets/img/settings/max.gif"]';
    const settingsUrl = 'appearance';
    const inboxUrl = 'inbox';

    it('should verify composer setting description text', () => {
        let composerSettingDescriptionSelector = '#saveComposerModeDescAria';
        let expectedText =
            'This sets the default composer size. Two sizes are available, a smaller popup composer, and a bigger full screen composer.';
        cy.get(composerSettingDescriptionSelector)
            .should('be.visible')
            .contains(expectedText);
    });

    it('should set the default composer state to be Popup', () => {
        //Make sure we always start from the same state.
        cy.get(maximizedSelector)
            .should('be.visible')
            .click();
        //Select popup
        cy.get(popupSelector)
            .should('be.visible')
            .click();
        notification.success('Compose mode saved');
        goTo(inboxUrl);
        composerHelper.open();
        composerHelper.isOpen();
        composerHelper.isMaximized(false);
        composerHelper.close();
    });

    it('should set the default composer state to be Maximized', () => {
        goTo(settingsUrl);
        //Select maximized
        cy.get(maximizedSelector)
            .should('be.visible')
            .click();
        notification.success('Compose mode saved');
        goTo(inboxUrl);
        composerHelper.open();
        composerHelper.isOpen();
        composerHelper.isMaximized();
        composerHelper.close();
    });
});
