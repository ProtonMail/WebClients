const autocompleteTest = require('../../support/helpers/autocomplete.cy');
const notification = require('../../support/helpers/notification.cy');
const modalTest = require('../../support/helpers/modals.cy');

const SUBJECT = 'alors monique ?';
const SUBJECT2 = 'Wesh alors polo ?';
const toListInput = autocompleteTest('.composer-field-ToList');
const discardModal = modalTest({
    title: 'Delete',
    message: 'Permanently delete this draft?'
});

it('should go to the draft state', () => {
    cy.navigate('drafts');
});

it('should not close the composer on save', () => {
    toListInput.fill('dew', 'dew', { invalid: true });
    cy.get('.composer [ng-model="message.Subject"]').type(SUBJECT);
    cy.get('.composerHeader-subject').contains(SUBJECT);

    cy.get('.composer-btn-save').click();
    cy.wait(500);
    cy.get('.composer').should('exist');
    notification.success('Message saved');
});

it('should save the draft inside the state draft', () => {
    cy
        .get('#conversation-list-columns .conversation')
        .eq(0)
        .find('.subject-text')
        .contains(SUBJECT);
});

it('should open the draft', () => {
    cy
        .get('.conversation')
        .eq(0)
        .click();
    cy.get('.composer').should('exist');
    cy.get('.composerHeader-subject').contains(SUBJECT);
});

it('should close the composer on close cross', () => {
    cy.get('.composer [ng-model="message.Subject"]').clear();
    cy.get('.composer [ng-model="message.Subject"]').type(SUBJECT2);
    cy.get('.composer-action-close').click();
    cy.wait(500);
    cy.get('.composer').should('not.exist');
});

it('should save the draft inside the state draft', () => {
    cy
        .get('#conversation-list-columns .conversation')
        .eq(0)
        .find('.subject-text')
        .contains(SUBJECT2);
});

it('should open a modal to delete the draft', () => {
    cy
        .get('.conversation')
        .eq(0)
        .click();
    cy.get('.composerHeader-subject').contains(SUBJECT2);

    discardModal.isOpen(false);
    cy.get('.composer-btn-discard').click();
    discardModal.isOpen();
});

it('should not close the composer on close', () => {
    discardModal.close();
    discardModal.isOpen(false);
    cy.get('.composer').should('exist');
});

it('should save the draft inside the state draft', () => {
    cy
        .get('#conversation-list-columns .conversation')
        .eq(0)
        .find('.subject-text')
        .contains(SUBJECT2);
});

it('should close the composer on confirm', () => {
    cy.deleteDraft();
});

it('should remove the draft inside the state draft', () => {
    cy.get('#conversation-list-columns .conversation').should('not.exist');
});
