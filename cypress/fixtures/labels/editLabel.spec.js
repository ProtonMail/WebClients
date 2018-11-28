const modalTest = require('../../support/helpers/modals.cy');
const notification = require('../../support/helpers/notification.cy');
const { toolbarLabel } = require('../../support/dropdown/labels');

const deleteLabelModal = modalTest({
    title: 'Delete label',
    message:
        'Are you sure you want to delete this label? Removing a label will not remove the messages with that label.'
});

const openLabelState = () => {
    cy.get('[id="tour-label-settings"]').click();
    cy.url().should('include', '/labels');
};

const NEW_LABEL = 'monique';
const CACHE = { label: {}, folder: {} };

it('should hide the dropdown for labels', () => {
    toolbarLabel.isOpen(false);
});

it('should be empty', () => {
    toolbarLabel.open();
    toolbarLabel.isEmpty();
});

it('should create a label', () => {
    const modal = toolbarLabel.create();
    modal.setName(NEW_LABEL);
    cy.get('.labelColorSelector-container')
        .find('[style="color: rgb(207, 88, 88);"]')
        .click();
    CACHE.label[NEW_LABEL] = '#cf5858';
    modal.save();
    modal.isOpen(false);
    notification.success('Label created');
    cy.get('[id="tour-label-dropdown"]').click();
    toolbarLabel.isOpen(false);
});

it('should add the color inside the list', () => {
    const color = CACHE.label[NEW_LABEL];
    toolbarLabel.open();
    toolbarLabel.hasLabel(NEW_LABEL, color);
    toolbarLabel.isOpen();
});

it('should not be empty', () => {
    toolbarLabel.isEmpty(false);
});

it('should close it', () => {
    cy.get('[id="tour-label-dropdown"]').click();
});

describe('Bind label to the webmail', () => {
    it('should display the label in the sidebar', () => {
        const color = CACHE.label[NEW_LABEL];
        cy.get('.menuLabel-item').should('have.length', 1);
        cy.get('.menuLabel-title').should('contain', NEW_LABEL);
        cy.get('.menuLabel-icon').should('have.attr', 'style', `color: ${color}`);
    });
});

describe('Delete existing label', () => {
    it('should redirect us from mail dashboard to labels state', () => {
        openLabelState();
    });

    it('should display a modal to delete the label', () => {
        deleteLabelModal.isOpen(false);
        cy.get(`.labelsState-btn-delete`).click();
        deleteLabelModal.isOpen();
        deleteLabelModal.submit();
        notification.success('Label deleted');
        delete CACHE.label[NEW_LABEL];
    });
});
