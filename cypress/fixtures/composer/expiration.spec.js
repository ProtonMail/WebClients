const message = require('./message.config');
const autocompleteTest = require('../../support/helpers/autocomplete.cy');
const { expiration, encrypt } = require('../../support/helpers/composerOptions.cy');
const notification = require('../../support/helpers/notification.cy');

const toListInput = autocompleteTest('.composer-field-ToList');
const panelExpiration = expiration();
const panelEncryption = encrypt();

panelExpiration.open();
panelExpiration.cancel();

describe('External dest', () => {
    const USERNAME = `pt-${Date.now()}-${Math.random()
        .toString(12)
        .slice(3, 12)}-${Date.now()}@foo.bar`;

    it('should set recepient ToList', () => {
        toListInput.fill(USERNAME, USERNAME);
    });

    panelExpiration.open();
    panelExpiration.addWeeks(1);
    panelExpiration.addDays(1);
    panelExpiration.addHours(1);
    panelExpiration.set();

    it('should display a notification', () => {
        cy.sendMessage(message.Subject('Expiration'), true);
        cy.wait(500);
        notification.error(
            'Expiring emails to non-ProtonMail recipients require a message password to be set. For more information, click here'
        );
        cy.deleteDraft();
    });
});

describe('External dest + non external', () => {
    const USERNAME = `pt-${Date.now()}-${Math.random()
        .toString(12)
        .slice(3, 12)}-${Date.now()}@foo.bar`;

    it('should set recepient ToList', () => {
        cy.compose();
        cy.wait(500);
        toListInput.fill(Cypress.env('login1'), message.ToList);
        toListInput.fill(USERNAME, USERNAME, { focus: true, many: true });
    });

    panelExpiration.open();
    panelExpiration.addWeeks(1);
    panelExpiration.addDays(1);
    panelExpiration.addHours(1);
    panelExpiration.set();

    it('should display a notification', () => {
        cy.sendMessage(message.Subject('Expiration'), true);
        cy.wait(500);
        notification.error(
            'Expiring emails to non-ProtonMail recipients require a message password to be set. For more information, click here'
        );
        cy.deleteDraft();
    });
});

describe('Non external', () => {
    it('should set recepient ToList', () => {
        cy.compose();
        cy.wait(500);

        toListInput.fill(message.email(), message.email());
    });

    panelExpiration.open();
    panelExpiration.addWeeks(1);
    panelExpiration.addDays(1);
    panelExpiration.addHours(1);
    panelExpiration.set();

    it('should display a notification', () => {
        cy.sendMessage(message.Subject('Expiration'));
    });
});

describe('External dest + password', () => {
    const USERNAME = `pt-${Date.now()}-${Math.random()
        .toString(12)
        .slice(3, 12)}-${Date.now()}@cpp.li`;

    it('should set recepient ToList', () => {
        cy.compose();
        toListInput.fill(USERNAME, USERNAME);
    });

    panelExpiration.open();
    panelExpiration.addWeeks(1);
    panelExpiration.addDays(1);
    panelExpiration.addHours(1);
    panelExpiration.set();

    panelEncryption.open();
    panelEncryption.fillInputs();
    panelEncryption.set();

    it('should send the message', () => {
        cy.sendMessage(message.Subject('Expiration'), true);
    });
});
