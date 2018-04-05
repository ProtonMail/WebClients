const message = require('./message.config');
const notification = require('../../support/helpers/notification.cy');
const autocompleteTest = require('../../support/helpers/autocomplete.cy');
const { getDragEnterEvent } = require('../../support/helpers/mockEvent.cy');

const toListInput = autocompleteTest('.composer-field-ToList');

it('should dnd a non uploadable content', () => {
    cy
        .get('.composer')
        .trigger('dragenter', getDragEnterEvent(false))
        .should('not.have.class', 'composer-draggable')
        .should('not.have.class', 'composer-draggable-editor');

    cy.get('.composer-dropzone').should('not.be.visible');
    cy.get('.composer-askEmbedding').should('not.be.visible');

    cy
        .get('.composer')
        .trigger('dragleave')
        .should('not.have.class', 'composer-draggable')
        .should('not.have.class', 'composer-draggable-editor');
    cy.get('.composer-askEmbedding').should('not.be.visible');
    cy.get('.composer-dropzone').should('not.be.visible');
    cy.get('.composerAttachments-container').should('not.be.visible');
});

it('should dnd an uploadable content', () => {
    cy.get('.composer-dropzone').should('not.be.visible');
    cy
        .get('.composer')
        .trigger('dragenter', getDragEnterEvent())
        .should('have.class', 'composer-draggable')
        .should('not.have.class', 'composer-draggable-editor');

    cy.get('.composer-dropzone').should('be.visible');
    cy.get('.composer-askEmbedding').should('not.be.visible');

    cy
        .get('.composer')
        .trigger('dragleave')
        .should('not.have.class', 'composer-draggable')
        .should('not.have.class', 'composer-draggable-editor');
    cy.get('.composer-askEmbedding').should('not.be.visible');
    cy.get('.composer-dropzone').should('not.be.visible');
    cy.get('.composerAttachments-container').should('not.be.visible');
});

it('should display a message box for an attachment', () => {
    cy.get('.composer-dropzone').should('not.be.visible');
    cy.dropFile('baby-1.jpg').then((event) => {
        cy
            .get('.composer')
            .trigger('dragenter', getDragEnterEvent())
            .should('have.class', 'composer-draggable')
            .should('not.have.class', 'composer-draggable-editor');

        cy.get('.composer-askEmbedding').should('not.be.visible');
        cy.get('.composer-dropzone').should('be.visible');

        cy
            .get('.composer')
            .trigger('drop', event)
            .should('have.class', 'composer-draggable')
            .should('have.class', 'composer-draggable-editor');

        cy.get('.composer-dropzone').should('be.visible');
        cy.get('.composer-askEmbedding').should('be.visible');

        cy.get('.composerAskEmbdded-btn-cancel').click();
        cy.get('.composer-dropzone').should('not.be.visible');
        cy.get('.composer-askEmbedding').should('not.be.visible');
        cy.get('.composerAttachments-container').should('not.be.visible');
    });
});

it('should add the image as inline', () => {
    cy.get('.composer-dropzone').should('not.be.visible');
    cy.dropFile('baby-1.jpg').then((event) => {
        cy
            .get('.composer')
            .trigger('dragenter', getDragEnterEvent())
            .should('have.class', 'composer-draggable')
            .should('not.have.class', 'composer-draggable-editor');

        cy.get('.composer-askEmbedding').should('not.be.visible');
        cy.get('.composer-dropzone').should('be.visible');

        cy
            .get('.composer')
            .trigger('drop', event)
            .should('have.class', 'composer-draggable')
            .should('have.class', 'composer-draggable-editor');

        cy.get('.composer-dropzone').should('be.visible');
        cy.get('.composer-askEmbedding').should('be.visible');

        cy.get('.composerAskEmbdded-btn-inline').click();
        cy.get('.composer-dropzone').should('not.be.visible');
        cy.get('.composer-askEmbedding').should('not.be.visible');

        cy.wait(1000);
        cy
            .get('.composer iframe')
            .then(($iframe) => {
                const $a = $iframe
                    .contents()
                    .find('div')
                    .find('.proton-embedded[alt="baby-1.jpg"]');
                return $a;
            })
            .should('exist');
        cy.get('.composerAttachments-container').should('be.visible');
    });
});

it('should count 1 embedded and no attachments', () => {
    cy.get('.composerAttachments-counter-attachments').should('not.be.visible');
    cy.get('.composerAttachments-counter-embedded').contains('1 embedded image');
});

it('should add the image as attachment', () => {
    cy.get('.composer-dropzone').should('not.be.visible');
    cy.dropFile('baby-2.jpg').then((event) => {
        cy
            .get('.composer')
            .trigger('dragenter', getDragEnterEvent())
            .should('have.class', 'composer-draggable')
            .should('not.have.class', 'composer-draggable-editor');

        cy.get('.composer-askEmbedding').should('not.be.visible');
        cy.get('.composer-dropzone').should('be.visible');

        cy
            .get('.composer')
            .trigger('drop', event)
            .should('have.class', 'composer-draggable')
            .should('have.class', 'composer-draggable-editor');

        cy.get('.composer-dropzone').should('be.visible');
        cy.get('.composer-askEmbedding').should('be.visible');

        cy.get('.composerAskEmbdded-btn-attachment').click();
        cy.get('.composer-dropzone').should('not.be.visible');
        cy.get('.composer-askEmbedding').should('not.be.visible');

        cy.wait(500);
        cy
            .get('.composer iframe')
            .then(($iframe) => {
                const $a = $iframe
                    .contents()
                    .find('div')
                    .find('.proton-embedded[alt="baby-2.jpg"]');
                return $a;
            })
            .should('not.exist');
        cy.get('.composerAttachments-container').should('be.visible');
    });
});

it('should count 1 embedded and 1 attachment', () => {
    cy.get('.composerAttachments-counter-attachments').contains('1 file attached');
    cy.get('.composerAttachments-counter-embedded').contains('1 embedded image');
});

it('should add a 2sd image inline', () => {
    cy.get('.composer-dropzone').should('not.be.visible');
    cy.dropFile('baby-2.jpg').then((event) => {
        cy
            .get('.composer')
            .trigger('dragenter', getDragEnterEvent())
            .should('have.class', 'composer-draggable')
            .should('not.have.class', 'composer-draggable-editor');

        cy.get('.composer-askEmbedding').should('not.be.visible');
        cy.get('.composer-dropzone').should('be.visible');

        cy
            .get('.composer')
            .trigger('drop', event)
            .should('have.class', 'composer-draggable')
            .should('have.class', 'composer-draggable-editor');

        cy.get('.composer-dropzone').should('be.visible');
        cy.get('.composer-askEmbedding').should('be.visible');

        cy.get('.composerAskEmbdded-btn-inline').click();
        cy.get('.composer-dropzone').should('not.be.visible');
        cy.get('.composer-askEmbedding').should('not.be.visible');
        cy.get('.composerAttachments-container').should('not.have.class', 'composerAttachments-close');

        cy.wait(500);
        cy
            .get('.composer iframe')
            .then(($iframe) => {
                const $a = $iframe
                    .contents()
                    .find('div')
                    .find('.proton-embedded[alt="baby-2.jpg"]');
                return $a;
            })
            .should('exist');
        cy.get('.composerAttachments-container').should('be.visible');
        cy.get('.composerAttachments-container').should('have.class', 'composerAttachments-close');
    });
});

it('should count 2 embedded and 1 attachment', () => {
    cy.get('.composerAttachments-counter-attachments').contains('1 file attached');
    cy.get('.composerAttachments-counter-embedded').contains('2 embedded images');
});

it('should add text file as attachment', () => {
    cy.get('.composer-dropzone').should('not.be.visible');
    cy.dropFile('test.txt').then((event) => {
        cy
            .get('.composer')
            .trigger('dragenter', getDragEnterEvent())
            .should('have.class', 'composer-draggable')
            .should('not.have.class', 'composer-draggable-editor');

        cy.get('.composer-askEmbedding').should('not.be.visible');
        cy.get('.composer-dropzone').should('be.visible');

        cy
            .get('.composer')
            .trigger('drop', event)
            .should('not.have.class', 'composer-draggable')
            .should('not.have.class', 'composer-draggable-editor');

        cy.get('.composer-dropzone').should('not.be.visible');
        cy.get('.composer-askEmbedding').should('not.be.visible');

        cy.wait(500);
        cy.get('.composerAttachments-container').should('be.visible');
    });
});

it('should count 2 embedded and 2 attachments', () => {
    cy.get('.composerAttachments-counter-attachments').contains('2 files attached');
    cy.get('.composerAttachments-counter-embedded').contains('2 embedded images');
});

it('should toggle the list of attachments', () => {
    cy.get('.composerAttachments-container').should('have.class', 'composerAttachments-close');
    cy.get('.composerAttachments-header').click();
    cy.get('.composerAttachments-container').should('not.have.class', 'composerAttachments-close');
    cy.get('.composerAttachments-header').click();
    cy.get('.composerAttachments-container').should('have.class', 'composerAttachments-close');
});

it('should contains 4 items', () => {
    cy.get('.composerAttachments-header').click();
    cy.get('.progressUpload-uploaded').should('have.length', 4);
    cy.get('.progressLoader-name').contains('baby-1.jpg');
    cy.get('.progressLoader-name').contains('baby-2.jpg');
    cy.get('.progressLoader-name').contains('test.txt');
});

it('should remove the inline attachment', () => {
    cy
        .get('.composerAttachmentsItem-container')
        .eq(0)
        .find('.progressLoader-btn-remove')
        .click();
    cy.get('.progressUpload-uploaded').should('have.length', 3);
    cy
        .get('.progressLoader-name')
        .eq(0)
        .should('not.eq', 'baby-1.jpg');
    cy
        .get('.progressLoader-name')
        .eq(1)
        .should('not.eq', 'baby-1.jpg');
    cy
        .get('.progressLoader-name')
        .eq(2)
        .should('not.eq', 'baby-1.jpg');

    cy.wait(500);
    cy
        .get('.composer iframe')
        .then(($iframe) => {
            const $a = $iframe
                .contents()
                .find('div')
                .find('.proton-embedded[alt="baby-1.jpg"]');
            return $a;
        })
        .should('not.exist');
});

it('should send the message', () => {
    toListInput.fill(Cypress.env('login1'), message.ToList, { focus: true });
    cy.sendMessage(message.Subject('attachments + embedded'));
});
