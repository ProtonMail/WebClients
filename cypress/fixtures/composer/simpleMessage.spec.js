const message = require('./message.config');
const autocompleteTest = require('../../support/helpers/autocomplete.cy');

const toListInput = autocompleteTest('.composer-field-ToList');

it('should set recepient ToList', () => {
    toListInput.fill(Cypress.env('login1'), message.ToList);
});

it('should fill the editor', () => {
    cy.get('.composer iframe').then(($iframe) => {
        $iframe
            .contents()
            .find('div')
            .html(message.body);

        return null;
    });
});

it('should send message with subject', () => {
    cy.sendMessage(message.Subject('simple'));
});
