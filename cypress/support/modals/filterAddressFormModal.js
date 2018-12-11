function test(type = 'Unknown list.') {
    const selector = (item = '') => cy.get(`.modal-dialog[name=filterAddressForm] * ${item}`.trim());
    const modalTitle = `Add to ${type}`;

    const isOpen = (open = true) => {
        if (open) {
            return selector().should('exist');
        }

        return selector().should('not.exist');
    };

    const title = (expectedTitle = modalTitle) => {
        let titleSelector = '.modal-title';
        selector(titleSelector)
            .should('exist')
            .should('be.visible')
            .contains(expectedTitle);
    };

    const verifyButton = (btnSelector, text, click) => {
        selector(btnSelector)
            .should('exist')
            .should('be.visible')
            .contains(text);

        if (click) {
            selector(btnSelector).click();
        }
    };

    const cancel = (click = false) => {
        let btnSelector = '.pm_button[ng-click="ctrl.cancel()"]';
        verifyButton(btnSelector, 'Cancel', click);
    };

    const save = (click = false) => {
        let btnSelector = '.pm_button.primary';
        verifyButton(btnSelector, 'Save', click);
    };

    const addEmail = (email = '', error = false) => {
        let emailSelector = '#emailAddress';

        selector(emailSelector)
            .should('exist')
            .should('be.visible')
            .type(email);

        if (error) {
            let invalidEmailSelector = 'div[ng-messages="filterAddressForm.emailAddress.$error"]';
            selector(invalidEmailSelector)
                .should('exist')
                .should('be.visible')
                .contains('Invalid email');
        }

        selector(emailSelector)
            .invoke('val')
            .then((text) => {
                const someText = text;
                assert.equal(someText, email);
            });
    };

    return {
        isOpen,
        title,
        cancel,
        save,
        addEmail
    };
}

module.exports = test;
