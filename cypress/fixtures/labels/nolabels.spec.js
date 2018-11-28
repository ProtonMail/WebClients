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
const NEW_FOLDER = 'roberto';
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
        cy.get('.labelColorSelector-container')
            .find('[style="color: rgb(207, 88, 88);"]')
            .click();
    });

    it('should add the color', () => {
        modal.save();
        modal.isOpen(false);
        notification.success('Label created');
    });

    const color = 'rgb(207, 88, 88);';

    it('should contains only one item', () => {
        cy.get('.labelsState-item').should('have.length', 1);
        cy.get('.labelsState-item-name').should('contain', NEW_LABEL);
        cy.get('.labelsState-item-icon').should('have.attr', 'style', `color: ${color}`);
        cy.get('.labelsState-item-icon').should('not.have.class', 'fa-folder');
        cy.get('.labelsState-item-icon').should('have.class', 'fa-tag');
        cy.get('.labelsState-toggle-label').should('not.exist');
    });

    it('should not allow to change notifications', () => {
        cy.get('.labelsState-toggle-label').should('not.exist');
    });
});

describe('Bind label to the webmail', () => {
    it('should display the label in the sidebar', () => {
        const color = '#cf5858';
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
        const color = '#cf5858';
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
        cy.get('.labelColorSelector-container')
            .find('[style="color: rgb(105, 169, 209);"]')
            .click();
    });

    it('should add the color', () => {
        modal.save();
        modal.isOpen(false);
        notification.success('Folder created', true);
    });

    it('should contains 1 item', () => {
        cy.get('.labelsState-item').should('have.length', 1);
    });

    const color = 'rgb(105, 169, 209);';

    it('should add a row for a folder', () => {
        cy.get('.labelsState-item-name').should('contain', NEW_FOLDER);
        cy.get('.labelsState-item-icon').should('have.attr', 'style', `color: ${color}`);
        cy.get('.labelsState-item-icon').should('have.class', 'fa-folder');
        cy.get('.labelsState-item-icon').should('not.have.class', 'fa-tag');
    });

    it('should allow to change notifications', () => {
        const item = cy.get(`.labelsState-item`).find('[style="color: rgb(105, 169, 209);"]');
        item.get('.labelsState-toggle-label').should('exist');
        item.get('[type="checkbox"]').should('not.have.class', 'ng-not-empty');
        cy.get('[type="checkbox"]').should('have.class', 'ng-empty');
    });

    it('should change the notification', () => {
        const item = cy
            .get(`.labelsState-item`)
            .find('[style="color: rgb(105, 169, 209);"]')
            .get('[data-name="changeNotifyLabel"]');
        item.get('[type="checkbox"]').check({ force: true, timeout: 500 });
        notification.success('Folder updated');
        cy.wait(1000);
        cy.get('[type="checkbox"]').should('have.class', 'ng-not-empty');
        cy.get('[type="checkbox"]').should('not.have.class', 'ng-empty');
        item.get('[type="checkbox"]').uncheck({ force: true, timeout: 500 });
        notification.success('Folder updated', false);
        cy.wait(1000);
        cy.get('[type="checkbox"]').should('have.class', 'ng-empty');
        cy.get('[type="checkbox"]').should('not.have.class', 'ng-not-empty');
    });
});

describe('Bind folder to the webmail', () => {
    it('should display the label in the sidebar', () => {
        const color = '#69a9d1';
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
        const color = '#69a9d1';
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
