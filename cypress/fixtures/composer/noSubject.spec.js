const message = require('./message.config');
const autocompleteTest = require('../../support/helpers/autocomplete.cy');
const notification = require('../../support/helpers/notification.cy');
const modalTest = require('../../support/helpers/modals.cy');

const toListInput = autocompleteTest('.composer-field-ToList');
const noSubjectModal = modalTest({
    title: 'No subject',
    message: 'No subject, send anyway?'
});

it('should open a confirm modal if we try to send', () => {
    noSubjectModal.isOpen(false);
    cy.sendMessage();
    noSubjectModal.isOpen(true);
    noSubjectModal.close();
    notification.error('Please enter at least one recipient.', false);
});

it('should throw an error if we send without a recipient', () => {
    noSubjectModal.isOpen(false);
    cy.sendMessage();
    noSubjectModal.isOpen(true);
    noSubjectModal.submit();
    notification.error('Please enter at least one recipient.');
});

it('should throw an error if we send without a valid recipient', () => {
    toListInput.fill('qatest123', 'qatest123', { invalid: true });
    noSubjectModal.isOpen(false);
    cy.sendMessage();
    noSubjectModal.isOpen(true);
    noSubjectModal.submit();
    notification.error('Invalid email(s): qatest123');
});

it('should throw an error if we send without a valid recipient 2', () => {
    toListInput.fill('qatest1234', 'qatest1234', { invalid: true, items: 2 });
    noSubjectModal.isOpen(false);
    cy.sendMessage();
    noSubjectModal.isOpen(true);
    noSubjectModal.submit();
    notification.error('Invalid email(s): qatest123,qatest1234');
    toListInput.remove('qatest123', false);
    toListInput.remove('qatest1234');
});

it('should set recepient ToList', () => {
    toListInput.fill(Cypress.env('login1'), message.ToList);
});

it('should fill the editor and send the message', () => {
    cy.get('.composer iframe').then(($iframe) => {
        $iframe
            .contents()
            .find('div')
            .html(message.body);

        return null;
    });
    cy.sendMessage();
    noSubjectModal.submit();
});
