function test(scope) {
    const main = (item = '') => `${scope} ${item}`.trim();
    const autocomplete = (item = '') => `${main('[name="autocomplete"]')} ${item}`.trim();

    const fill = (input, output, { invalid = false, items = 0, focus = false, many = false } = {}) => {
        focus && cy.get(main()).click();
        !items && !many && cy.get(main('.autocompleteEmails-item')).should('not.exist');

        if (input.includes('@') || invalid) {
            cy
                .get(autocomplete())
                .type(input)
                .focus()
                .blur();
        } else {
            cy.get(autocomplete()).type(input + '@');
            cy.get(main('.autocompleteEmails-autocomplete li:first-child')).click();
        }
        cy.get(autocomplete()).should('have.value', '');

        cy.get(main('.autocompleteEmails-item')).should('exist');
        cy
            .get(main('.autocompleteEmails-item'))
            .should(`${invalid ? '' : 'not.'}have.class`.trim(), 'autocompleteEmails-item-invalid');

        if (items) {
            cy.get(main('.autocompleteEmails-item-invalid')).should('have.length', items);
        }
        cy.get(main('.autocompleteEmails-label')).contains(output);
    };

    const defaultDomains = (focus = true) => {
        const USERNAME = `${Date.now()}@`;
        focus && cy.get(main()).click();
        cy.get(main('.autocompleteEmails-autocomplete')).should('not.be.visible');

        cy.get(autocomplete()).type(USERNAME);

        cy.get(main('.autocompleteEmails-autocomplete')).should('not.have.attr', 'hidden');
        cy.get(main('.autocompleteEmails-autocomplete li:first-child mark')).contains(USERNAME);
        cy.get(main('.autocompleteEmails-autocomplete li:first-child')).contains('protonmail.com');

        cy.get(main('.autocompleteEmails-autocomplete li:nth-child(2) mark')).contains(USERNAME);
        cy.get(main('.autocompleteEmails-autocomplete li:nth-child(2)')).contains('protonmail.ch');

        cy.get(main('.autocompleteEmails-autocomplete li:nth-child(3) mark')).contains(USERNAME);
        cy.get(main('.autocompleteEmails-autocomplete li:nth-child(3)')).contains('gmail.com');

        cy.get(main('.autocompleteEmails-autocomplete li:nth-child(4) mark')).contains(USERNAME);
        cy.get(main('.autocompleteEmails-autocomplete li:nth-child(4)')).contains('hotmail.com');

        cy.get(main('.autocompleteEmails-autocomplete li:nth-child(5) mark')).contains(USERNAME);
        cy.get(main('.autocompleteEmails-autocomplete li:nth-child(5)')).contains('live.com');

        cy.get(main('.autocompleteEmails-autocomplete li:nth-child(6) mark')).contains(USERNAME);
        cy.get(main('.autocompleteEmails-autocomplete li:nth-child(6)')).contains('yahoo.com');

        cy.get(main('.autocompleteEmails-autocomplete li:nth-child(7) mark')).contains(USERNAME);
        cy.get(main('.autocompleteEmails-autocomplete li:nth-child(7)')).contains('outlook.com');

        cy
            .get(autocomplete())
            .clear()
            .blur();
        cy.get(main('.autocompleteEmails-autocomplete')).should('not.be.visible');
    };

    const remove = (adr, uniq = true) => {
        cy.get(main(`.autocompleteEmails-btn-remove[data-address="${adr}"]`)).click();
        uniq && cy.get(main('.autocompleteEmails-item')).should('not.exist');
    };

    return { fill, defaultDomains, remove };
}

module.exports = test;
