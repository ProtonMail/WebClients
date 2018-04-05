const modalTest = require('../../support/helpers/modals.cy');
const notification = require('../../support/helpers/notification.cy');
const { hexToRgb } = require('../../support/helpers/string.cy');
const { addLabel, addFolder } = require('../../support/modals/colorModal');

const deleteLabelModal = modalTest({
    title: 'Delete label',
    message:
        'Are you sure you want to delete this label? Removing a label will not remove the messages with that label.'
});

const deleteFolderModal = modalTest({
    title: 'Delete folder',
    message:
        'Are you sure you want to delete this folder? Messages in the folders aren’t deleted if the folder is deleted, they can still be found in all mail. If you want to delete all messages in a folder, move them to trash.'
});

const openLabelState = () => {
    cy.get('[id="tour-label-settings"]').click();
    cy.url().should('include', '/labels');
};

const NEW_LABEL = 'monique';
const NEW_FOLDER = 'pedro';
const COLORS = { folder: {}, label: {} };

it('should not contains labels', () => {
    cy.get('.menuLabel-container li').should('have.length', 0);
});

it('should redirect us from mail dashboard to labels state', () => {
    openLabelState();
});

it('should not contains any labels and it shows a message', () => {
    cy.get('.labelsState-msg-info').should('contain', 'You have no labels.');
});

describe('Add a label', () => {
    const modal = addLabel();

    it('should open a modal', () => {
        modal.isOpen(false);
        cy.get('.labelsState-btn-add').click();
        modal.isOpen();
    });

    it('should focus the input name', () => {
        const input = modal.selector('.labelModal-input-name');
        cy.focused().should('have.attr', 'name', 'label');
        input.should('have.value', '');
    });

    it('should hide errors', () => {
        const { isValid, required } = modal.getErrors();
        isValid.should('not.exist');
        required.should('not.be.visible');
    });

    it('should display an error if invalid char', () => {
        modal.setName('lol<>lol', { invalid: true });
    });

    it('should display an error if empty', () => {
        modal.setName('', { required: true });
    });

    it('should display nothing if the label is valid', () => {
        modal.setName(NEW_LABEL);
    });

    it('should check a color', () => {
        modal.setColor();
    });

    it('should add the color', () => {
        modal.save();
        modal.isOpen(false);
        notification.success('Label created');
    });

    it('should contains only one item', () => {
        cy.get('.labelsState-item').should('have.length', 1);
        cy.get('.labelsState-item-name').should('contain', NEW_LABEL);
        cy.get('.labelsState-item-icon').should('have.attr', 'style', `color: ${hexToRgb(modal.getColor())};`);
        cy.get('.labelsState-item-icon').should('not.have.class', 'fa-folder');
        cy.get('.labelsState-item-icon').should('have.class', 'fa-tag');
        cy.get('.labelsState-toggle-label').should('not.exist');
    });

    it('should contains only one item', () => {
        cy.get('.labelsState-item').should('have.length', 1);
    });

    it('should add a row for a label', () => {
        COLORS.label[NEW_LABEL] = modal.getColor();
        const item = cy.get(`.labelsState-item[data-color="${modal.getColor()}"]`);
        item.get('.labelsState-item-name').should('contain', NEW_LABEL);
        item.get('.labelsState-item-icon').should('have.attr', 'style', `color: ${hexToRgb(modal.getColor())};`);
        item.get('.labelsState-item-icon').should('not.have.class', 'fa-folder');
        item.get('.labelsState-item-icon').should('have.class', 'fa-tag');
    });

    it('should not allow to change notifications', () => {
        const item = cy.get(`.labelsState-item[data-color="${modal.getColor()}"]`);
        item.get('.labelsState-toggle-label').should('not.exist');
    });
});

describe('Bind label to the webmail', () => {
    it('should display the label in the sidebar', () => {
        const color = COLORS.label[NEW_LABEL];
        cy.clickBack();
        cy.url().should('include', '/inbox');
        cy.get('.menuLabel-item').should('have.length', 1);
        cy.get('.menuLabel-title').should('contain', NEW_LABEL);
        cy.get('.menuLabel-icon').should('have.attr', 'style', `color: ${color}`);
        openLabelState();
    });
});
describe('Add existing label', () => {
    const modal = addLabel();

    it('should open a modal', () => {
        modal.isOpen(false);
        cy.get('.labelsState-btn-add').click();
        modal.isOpen();
    });

    it('should bind the color', () => {
        modal.setName(NEW_LABEL);
    });

    it('should fail to add the color', () => {
        modal.save();
        modal.isOpen();
        notification.error('Label or folder with this name already exists');
        modal.closeCross();
    });
});

describe('delete existing label', () => {
    it('should display a modal to delete the label', () => {
        const color = COLORS.label[NEW_LABEL];
        deleteLabelModal.isOpen(false);
        cy.get(`.labelsState-item[data-color="${color}"] .labelsState-btn-delete`).click();
        deleteLabelModal.isOpen();
        deleteLabelModal.submit();
        notification.success('Label deleted');
        delete COLORS.label[NEW_LABEL];
    });
});

describe('Add a folder', () => {
    const modal = addFolder();

    it('should open a modal', () => {
        modal.isOpen(false);
        cy.get('.labelsState-btn-add-folder').click();
        modal.isOpen();
    });

    it('should focus the input name', () => {
        const input = modal.selector('.labelModal-input-name');
        cy.focused().should('have.attr', 'name', 'label');
        input.should('have.value', '');
    });

    it('should hide errors', () => {
        const { isValid, required } = modal.getErrors();
        isValid.should('not.exist');
        required.should('not.be.visible');
    });

    it('should display an error if invalid char', () => {
        modal.setName('lol<>lol', { invalid: true });
    });

    it('should display an error if empty', () => {
        modal.setName('', { required: true });
    });

    it('should display nothing if the label is valid', () => {
        modal.setName(NEW_FOLDER);
    });

    it('should check a color', () => {
        modal.setColor();
    });

    it('should add the color', () => {
        modal.save();
        modal.isOpen(false);
        notification.success('Folder created', true);
    });

    it('should contains 1 item', () => {
        cy.get('.labelsState-item').should('have.length', 1);
    });

    it('should add a row for a folder', () => {
        COLORS.folder[NEW_FOLDER] = modal.getColor();
        const item = cy.get(`.labelsState-item[data-color="${modal.getColor()}"]`);
        item.get('.labelsState-item-name').should('contain', NEW_FOLDER);
        item.get('.labelsState-item-icon').should('have.attr', 'style', `color: ${hexToRgb(modal.getColor())};`);
        item.get('.labelsState-item-icon').should('have.class', 'fa-folder');
        item.get('.labelsState-item-icon').should('not.have.class', 'fa-tag');
    });

    it('should allow to change notifications', () => {
        const item = cy.get(`.labelsState-item[data-color="${modal.getColor()}"]`);
        item.get('.labelsState-toggle-label').should('exist');
        item.get('[data-name="changeNotifyLabel"]').should('have.class', 'off');
        item.get('[data-name="changeNotifyLabel"]').should('not.have.class', 'on');
    });

    it('should change the notification', () => {
        const item = cy
            .get(`.labelsState-item[data-color="${modal.getColor()}"]`)
            .get('[data-name="changeNotifyLabel"]');
        item.should('have.class', 'off');
        item.should('not.have.class', 'on');

        item.get('span.on').click();
        cy.wait(500);
        notification.success('Folder updated');
        cy.wait(1000);
        item.should('have.class', 'on');
        item.should('not.have.class', 'off');

        item.get('span.off').click();
        cy.wait(500);
        notification.success('Folder updated', false);
        cy.wait(1000);
        item.should('have.class', 'off');
        item.should('not.have.class', 'on');
    });
});

describe('Bind folder to the webmail', () => {
    it('should display the label in the sidebar', () => {
        const color = COLORS.folder[NEW_FOLDER];
        cy.clickBack();
        cy.url().should('include', '/inbox');
        cy.get('.menuLabel-item').should('have.length', 1);
        cy.get('.menuLabel-title').should('contain', NEW_FOLDER);
        cy.get('.menuLabel-icon').should('have.attr', 'style', `color: ${color}`);
        openLabelState();
    });
});

describe('Add existing folder', () => {
    const modal = addFolder();

    it('should open a modal', () => {
        modal.isOpen(false);
        cy.get('.labelsState-btn-add-folder').click();
        modal.isOpen();
    });

    it('should bind the color', () => {
        modal.setName(NEW_FOLDER);
    });

    it('should fail to add the color', () => {
        modal.save();
        modal.isOpen();
        notification.error('Label or folder with this name already exists');
        modal.closeCross();
    });
});

describe('Delete existing folder', () => {
    it('should display a modal to delete the label', () => {
        deleteFolderModal.isOpen(false);
        const color = COLORS.folder[NEW_FOLDER];
        cy.get(`.labelsState-item[data-color="${color}"] .labelsState-btn-delete`).click();
        deleteFolderModal.isOpen();
        deleteFolderModal.submit();
        notification.success('Folder deleted');
        delete COLORS.folder[NEW_FOLDER];
    });
});

it('should not contains labels', () => {
    cy.get('.menuLabel-container li').should('have.length', 0);
});
