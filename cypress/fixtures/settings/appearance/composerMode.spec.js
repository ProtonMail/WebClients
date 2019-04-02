const notification = require('../../../support/helpers/notification.cy');
const { helper } = require('../../../support/helpers/composerOptions.cy');

const composerHelper = helper();

function goTo(url) {
    cy.visit(`${Cypress.env('server')}${url}`);
    cy.url().should('include', `/${url}`);
}

describe('Composer mode', () => {
    const composerModeSelector = '.chooseComposerMode-container > * select';
    const settingsUrl = 'appearance';
    const inboxUrl = 'inbox';

    it('should set the default composer mode to Plaintext', () => {
        //Make sure we always start from the same state.
        cy.get(composerModeSelector).select('Normal');
        // It takes 8 seconds for a notification to close.
        //If you don't wait, the next notification.success() call will fail.
        cy.wait(8000);
        //Select Plaintext
        cy.get(composerModeSelector)
            .should('be.visible')
            .select('Plain Text');
        notification.success('Change composer mode to Plain Text');
        goTo(inboxUrl);
        composerHelper.open();
        composerHelper.isPlaintextMode();
        composerHelper.close();
    });

    it('should set the default composer mode to Normal', () => {
        goTo(settingsUrl);
        cy.get(composerModeSelector).select('Normal');
        notification.success('Change composer mode to Normal');
        goTo(inboxUrl);
        composerHelper.open();
        composerHelper.isNormalMode();
        composerHelper.close();
    });
});
