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
    const selector = (item = '') => `.composer .addLinkPopover-container ${item}`.trim();

    it('should bind a link + label inside the editor', () => {
        cy.get(selector()).should('not.be.visible');
        cy.get('.squireToolbar-action-link').click();
        cy.get(selector()).should('be.visible');
        cy.get(selector('#labelLink')).type(message.linkLabel);
        cy.get(selector('#urlLink')).type(message.linkImage);
        cy.get(selector('.addLinkPopover-btn-new')).click();
        cy.get(selector()).should('not.be.visible');

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
        cy.get(selector()).should('not.be.visible');
        cy.get('.squireToolbar-action-link').click();
        cy.get(selector()).should('be.visible');
        cy
            .get(selector('#labelLink'))
            .clear()
            .type(message.linkImage);
        cy
            .get(selector('#urlLink'))
            .clear()
            .type(message.linkImage);
        cy.get(selector('.addLinkPopover-btn-new')).click();
        cy.get(selector()).should('not.be.visible');

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
        cy.get(selector()).should('not.be.visible');
        cy.get('.squireToolbar-action-link').click();
        cy.get(selector()).should('be.visible');
        cy
            .get(selector('#labelLink'))
            .clear()
            .type('POLO');
        cy.get(selector('.addLinkPopover-btn-edit')).click();
        cy.get(selector()).should('not.be.visible');

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
        cy.get(selector()).should('not.be.visible');
        cy.get('.squireToolbar-action-link').click();
        cy.get(selector()).should('be.visible');
        cy
            .get(selector('#urlLink'))
            .clear()
            .type(LINK_EDIT);
        cy.get(selector('.addLinkPopover-btn-edit')).click();
        cy.get(selector()).should('not.be.visible');

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
        cy.get(selector()).should('not.be.visible');
        cy.get('.squireToolbar-action-link').click();
        cy.get(selector()).should('be.visible');
        cy.get(selector('.addLinkPopover-btn-remove')).click();
        cy.get(selector()).should('not.be.visible');

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
    const selector = (item = '') => `.composer .addFilePopover-container ${item}`.trim();

    it('should attach an external image', () => {
        cy.get(selector()).should('not.be.visible');
        cy.get('.squireToolbar-action-image').click();
        cy.get(selector()).should('be.visible');
        cy.get(selector('input[type="url"]')).type(message.linkImage);
        cy.get(selector('.addFilePopover-btn-url')).click();
        cy.get(selector()).should('not.be.visible');

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
