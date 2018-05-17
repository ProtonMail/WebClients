const message = require('./message.config');
const LINK_EDIT = 'https://protonmail.com/monique';

it('should toggle a button state bold', () => {
    cy.get('.squireToolbar-container').should('not.have.class', 'b');
    cy.get('.squireToolbar-action-bold').click();
    cy.get('.squireToolbar-container').should('have.class', 'b');
});

it('should toggle a button state italic', () => {
    cy.get('.squireToolbar-container').should('not.have.class', 'i');
    cy.get('.squireToolbar-action-italic').click();
    cy.get('.squireToolbar-container').should('have.class', 'i');
});

it('should toggle a button underline', () => {
    cy.get('.squireToolbar-container').should('not.have.class', 'u');
    cy.get('.squireToolbar-action-underline').click();
    cy.get('.squireToolbar-container').should('have.class', 'u');
});

it('should toggle a button underline', () => {
    cy.get('.composer iframe').then(($iframe) => {
        $iframe
            .contents()
            .find('div')
            .html(message.body);
        return null;
    });

    cy.get('.composer iframe').then(($iframe) => {
        const txt = $iframe
            .contents()
            .find('div')
            .html();
        expect(txt).to.equal(message.body);
        return null;
    });
});

describe('Links', () => {
    const SELECTOR = {
        container: '.addLink-container',
        labelInput: '.addLink-labelLinkInput',
        urlInput: '.addLink-urlLinkInput',
        openButton: '.squireToolbar-action-link',
        insertButton: '.addLink-insert-button',
        removeButton: '.addLink-remove-button'
    };

    it('should bind a link + label inside the editor', () => {
        cy.get(SELECTOR.container).should('not.be.visible');
        cy.get(SELECTOR.openButton).click();
        cy.get(SELECTOR.container).should('be.visible');
        cy.get(SELECTOR.labelInput).type(message.linkLabel);
        cy.get(SELECTOR.urlInput).type(message.linkImage);
        cy.get(SELECTOR.insertButton).click();
        cy.get(SELECTOR.container).should('not.be.visible');

        cy
            .get('.composer iframe')
            .then(($iframe) => {
                const $a = $iframe
                    .contents()
                    .find('div')
                    .find(`a[href="${message.linkImage}"]`);
                return $a;
            })
            .contains(message.linkLabel)
            .should('have.attr', 'href', message.linkImage);
    });

    it('should bind a link inside the editor', () => {
        cy.get(SELECTOR.container).should('not.be.visible');
        cy.get(SELECTOR.openButton).click();
        cy.get(SELECTOR.container).should('be.visible');
        cy
            .get(SELECTOR.labelInput)
            .clear()
            .type(message.linkImage);
        cy
            .get(SELECTOR.urlInput)
            .clear()
            .type(message.linkImage);
        cy.get(SELECTOR.insertButton).click();
        cy.get(SELECTOR.container).should('not.be.visible');

        cy
            .get('.composer iframe')
            .then(($iframe) => {
                const $a = $iframe
                    .contents()
                    .find('div')
                    .find(`a[href="${message.linkImage}"]`);
                return $a;
            })
            .contains(message.linkImage)
            .should('have.attr', 'href', message.linkImage);
    });

    it('should edit a link inside the editor', () => {
        cy.get(SELECTOR.container).should('not.be.visible');
        cy.get(SELECTOR.openButton).click();
        cy.get(SELECTOR.container).should('be.visible');
        cy
            .get(SELECTOR.labelInput)
            .clear()
            .type('POLO');
        cy.get(SELECTOR.insertButton).click();
        cy.get(SELECTOR.container).should('not.be.visible');

        cy
            .get('.composer iframe')
            .then(($iframe) => {
                const $a = $iframe
                    .contents()
                    .find('div')
                    .find(`a[href="${message.linkImage}"]`);
                return $a;
            })
            .contains('POLO')
            .should('have.attr', 'href', message.linkImage);
    });

    it('should edit a link inside the editor 2', () => {
        cy.get(SELECTOR.container).should('not.be.visible');
        cy.get(SELECTOR.openButton).click();
        cy.get(SELECTOR.container).should('be.visible');
        cy
            .get(SELECTOR.urlInput)
            .clear()
            .type(LINK_EDIT);
        cy.get(SELECTOR.insertButton).click();
        cy.get(SELECTOR.container).should('not.be.visible');

        cy
            .get('.composer iframe')
            .then(($iframe) => {
                const $a = $iframe
                    .contents()
                    .find('div')
                    .find(`a[href="${LINK_EDIT}"]`);
                return $a;
            })
            .contains('POLO')
            .should('have.attr', 'href', LINK_EDIT);
    });

    it('should delete a link inside the editor', () => {
        cy.get(SELECTOR.container).should('not.be.visible');
        cy.get(SELECTOR.openButton).click();
        cy.get(SELECTOR.container).should('be.visible');
        cy.get(SELECTOR.removeButton).click();
        cy.get(SELECTOR.container).should('not.be.visible');

        cy
            .get('.composer iframe')
            .then(($iframe) => {
                const $a = $iframe
                    .contents()
                    .find('div')
                    .find(`a[href="${LINK_EDIT}"]`);
                return $a;
            })
            .should('not.exist');
    });
});

describe('Images', () => {
    const SELECTOR = {
        container: '.addFile-container',
        urlInput: '.addFile-addressInput',
        openButton: '.squireToolbar-action-image',
        insertButton: '.addFile-insert-button'
    };

    it('should attach an external image', () => {
        cy.get(SELECTOR.container).should('not.be.visible');
        cy.get(SELECTOR.openButton).click();
        cy.wait(150);
        cy.get(SELECTOR.container).should('be.visible');
        cy.get(SELECTOR.urlInput).type(message.linkImage);
        cy.get(SELECTOR.insertButton).click();
        cy.get(SELECTOR.container).should('not.be.visible');

        cy
            .get('.composer iframe')
            .then(($iframe) => {
                const $a = $iframe
                    .contents()
                    .find('div')
                    .find(`img[src="${message.linkImage}"]`);
                return $a;
            })
            .should('exist');
    });
});
describe('Clean', () => {
    it('should delete the draft', () => {
        cy.deleteDraft();
    });
});
