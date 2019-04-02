const notification = require('../../../support/helpers/notification.cy');
const { helper } = require('../../../support/helpers/composerOptions.cy');

const composerHelper = helper();

function goTo(url) {
    cy.visit(`${Cypress.env('server')}${url}`);
    cy.url().should('include', `/${url}`);
}

describe('Text direction', () => {
    const composerTextDirectionSelector = '.chooseTextDirection-select';
    const settingsUrl = 'appearance';
    const inboxUrl = 'inbox';

    it('should set the default composer text direction to Right to left', () => {
        //Make sure we always start from the same state.
        cy.get(composerTextDirectionSelector).select('Left to Right');
        // It takes 8 seconds for a notification to close.
        //If you don't wait, the next notification.success() call will fail.
        cy.wait(8000);
        //Select right to left
        cy.get(composerTextDirectionSelector)
            .should('be.visible')
            .select('Right to Left');
        notification.success('Change default text direction to Right to Left');
        goTo(inboxUrl);
        composerHelper.open();
        composerHelper.isRightToLeft();
        composerHelper.close();
    });

    it('should set the default composer text direction to Left to right', () => {
        goTo(settingsUrl);
        cy.get(composerTextDirectionSelector).select('Left to Right');
        notification.success('Change default text direction to Left to Right');
        goTo(inboxUrl);
        composerHelper.open();
        composerHelper.isLeftToRight();
        composerHelper.close();
    });
});
