export function footerClick(button) {
    cy.get(`.modal-footer > ${button}`)
        .first()
        .click();
}

export const openContactState = () => {
    cy.get('[ui-sref-active="active"] > .navigation-link > .navigation-title').click();
    cy.url().should('include', '/contacts');
};

export const verifyContactBeforeMerge = (type, value, first = true) => {
    if (first) {
        cy.get(`${type}`)
            .first()
            .should('contain', value);
    } else {
        cy.get(`${type}`)
            .last()
            .should('contain', value);
    }
};

export const verifyContactPreview = (order, value) => {
    cy.get(`:nth-child(${order}) > .contactDisplay-item > .contactDisplay-item-value`).should('contain', value);
};

export const verifyContactAfterMerge = (number, value) => {
    cy.get('.contactList-item-name')
        .eq(number)
        .should('contain', value);
};