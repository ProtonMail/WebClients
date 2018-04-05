const notification = require('../../support/helpers/notification.cy');
const { encrypt } = require('../../support/helpers/composerOptions.cy');

const panelEncryption = encrypt();

describe('Toggle panel', () => {
    panelEncryption.open();
    panelEncryption.fillInputs();
    panelEncryption.cancel();

    it('should clear inputs', () => {
        cy.get('.composer-btn-encryption').click();
        cy.get('.composer-options-encryption').should('be.visible');

        cy.get('[name="outsidePw"]').should('have.value', '');
        cy.get('[name="outsidePwConfirm"]').should('have.value', '');
        cy.get('[name="outsidePwHint"]').should('have.value', '');
    });

    panelEncryption.cancel();
});

describe('Does not match password panel', () => {
    panelEncryption.open();
    panelEncryption.fillInputs({ confirm: 'robert' });

    it('should send an error notification', () => {
        cy.get('.composerEncrypt-btn-submit').click();
        notification.error('Message passwords do not match.');
        cy.get('.composer-options-encryption').should('be.visible');
    });

    panelEncryption.cancel();
});

describe('Match password', () => {
    panelEncryption.open();
    panelEncryption.fillInputs({ hint: '' });
    panelEncryption.set();
});
