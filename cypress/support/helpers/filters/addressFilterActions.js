function test(type = 'unknown') {
    const deleteListSelector = `#${type.toLowerCase()} * .emailBlockList-btn-delete`;
    const emailListSelector = `#${type.toLowerCase()} .emailBlocklist-row-value`;
    const emailMoveActionSelector = `#${type.toLowerCase()} .emailBlockList-btn-switch`;
    const infoMessageSelector = `#${type.toLowerCase()} * .alert-info`;
    const infoMessage = `No emails in the ${type}, click Add to add addresses to the ${type}`;

    const clearFilter = () => {
        cy.get('body').then(($body) => {
            if ($body.find(deleteListSelector).length) {
                cy.get(deleteListSelector).each((email) => {
                    cy.wrap(email).click();
                });
            }
            isEmpty(true);
        });
    };

    const containsEmail = (email) => {
        cy.get(emailListSelector).contains(email.toLowerCase());
    };

    const isEmpty = (empty = false) => {
        if (empty) {
            return cy
                .get(infoMessageSelector)
                .should('be.visible')
                .contains(infoMessage);
        }

        return cy.get(infoMessageSelector).should('be.hidden');
    };

    const moveAll = () => {
        cy.get('body').then(($body) => {
            if ($body.find(emailMoveActionSelector).length) {
                cy.get(emailMoveActionSelector).each((email) => {
                    cy.wrap(email).click();
                });
            }
            isEmpty(true);
        });
    };

    return {
        clearFilter,
        containsEmail,
        isEmpty,
        moveAll
    };
}

module.exports = test;
