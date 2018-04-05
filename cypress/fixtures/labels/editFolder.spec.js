const modalTest = require('../../support/helpers/modals.cy');
const notification = require('../../support/helpers/notification.cy');
const { toolbarFolder } = require('../../support/dropdown/labels');

const deleteFolderModal = modalTest({
    title: 'Delete folder',
    message:
        'Are you sure you want to delete this folder? Messages in the folders aren’t deleted if the folder is deleted, they can still be found in all mail. If you want to delete all messages in a folder, move them to trash.'
});

const openLabelState = () => {
    cy.get('[id="tour-label-settings"]').click();
    cy.url().should('include', '/labels');
};

const NEW_FOLDER = 'roberto';
const CACHE = { folder: {} };

it('should hide the dropdown for folders', () => {
    toolbarFolder.isOpen(false);
});

it('should be open with default', () => {
    toolbarFolder.open();
    toolbarFolder.checkDefault();
});

it('should create a folder', () => {
    const modal = toolbarFolder.create();
    modal.setName(NEW_FOLDER);
    modal.setColor('#cf5858');
    CACHE.folder[NEW_FOLDER] = '#cf5858';
    modal.save();
    modal.isOpen(false);
    notification.success('Folder created');
    toolbarFolder.isOpen(false);
});

it('should add the color inside the list', () => {
    const color = CACHE.folder[NEW_FOLDER];
    toolbarFolder.open();
    toolbarFolder.hasFolder(NEW_FOLDER, color);
    toolbarFolder.isOpen();
});

it('should close it', () => {
    toolbarFolder.close();
});

describe('Bind folder to the webmail', () => {
    it('should display the folder in the sidebar', () => {
        const color = CACHE.folder[NEW_FOLDER];
        cy.get('.menuLabel-item').should('have.length', 1);
        cy.get('.menuLabel-title').should('contain', NEW_FOLDER);
        cy.get('.menuLabel-icon').should('have.attr', 'style', `color: ${color}`);
    });
});

describe('delete existing folder', () => {
    it('should display a modal to delete the folder', () => {
        openLabelState();
        const color = CACHE.folder[NEW_FOLDER];
        deleteFolderModal.isOpen(false);
        cy.get(`.labelsState-item[data-color="${color}"] .labelsState-btn-delete`).click();
        deleteFolderModal.isOpen();
        deleteFolderModal.submit();
        notification.success('Folder deleted');
        delete CACHE.folder[NEW_FOLDER];
    });
});
