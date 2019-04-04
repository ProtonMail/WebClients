import * as contactActions from '../../support/helpers/contactActions.cy';

import { CONTACTS, CONTACT_LIST_VIEW, CONTACTS_GENERAL } from '../../support/helpers/contactList.cy';

const nonFormModalTest = require('../../support/helpers/nonFormModals.cy');
const modalTest = require('../../support/helpers/modals.cy');
const notification = require('../../support/helpers/notification.cy');

const COMPOSE_BUTTON = '.compose';
const CLOSE_BUTTON = '.close-button';
const DELETE_BUTTON = '.delete';

const addContactModal = nonFormModalTest({
    title: 'Add contact',
    type: 'contactModal'
});

const deleteContactModal = modalTest({
    title: 'Delete',
    message: 'Are you sure you want to delete this contact?'
});

const deleteAllContactsModal = modalTest({
    title: 'Delete all',
    message: 'Are you sure you want to delete all your contacts?'
});

it('should redirect to the contacts state', () => {
    contactActions.openContactState();
});

describe('Add contacts', () => {
    it('Should not contains any contacts', () => {
        cy.get(CONTACT_LIST_VIEW.CONTACT_VIEW_DETAIL).should('not.exist');
    });

    it(' should check for focus on the input field', () => {
        addContactModal.isOpen(false);
        cy.get('[data-action="add"]').click();
        addContactModal.isOpen();
        cy.focused().should('have.attr', 'name', 'name_Name0');
    });

    it('should add an empty contact via the main add button', () => {
        addContactModal.submitInvalid();
        notification.error('This form is invalid');
    });

    it('should add contact with invalid email', () => {
        cy.get('[name="name_Emailaddress0"]').type('polo');
        addContactModal.submitInvalid();
        notification.error('This form is invalid');
        cy.get('[ng-message="email"]').should('contain', 'Invalid email');
        cy.get('[name="name_Emailaddress0"]').clear();
    });

    it('should add a valid contact with a name and email', () => {
        cy.get('[name="name_Name0"]').type(CONTACTS.CONTACT_ONE_NAME);
        cy.get('[name="name_Emailaddress0"]').type(CONTACTS.CONTACT_ONE_EMAIL);
        addContactModal.submit();
    });

    it('should check if first contact exists', () => {
        cy.get(CONTACT_LIST_VIEW.CONTACT_VIEW_NAME).should('contain', CONTACTS.CONTACT_ONE_NAME);
        cy.get(CONTACT_LIST_VIEW.CONTACT_VIEW_EMAIL).should('contain', CONTACTS.CONTACT_ONE_EMAIL);
    });

    it('should check that input fields are empty', () => {
        cy.get('[data-action="addContact"]').click({ force: true });
        cy.get('[name="name_Name0"]').should('contain', '');
        cy.get('[name="name_Emailaddress0"]').should('contain', '');
    });

    it('should add contact with name but without an email', () => {
        cy.get('[name="name_Name0"]').type(CONTACTS.CONTACT_TWO_NAME);
        addContactModal.submit();
    });

    it('should go back to contact list and verify second contact exists', () => {
        cy.get('.active > .navigation-link > .navigation-title').click();
        cy.get(CONTACT_LIST_VIEW.CONTACT_LIST_NAME).should('contain', CONTACTS.CONTACT_TWO_NAME);
        cy.get('.contactList-item-email-wrapper')
            .eq(1)
            .should('contain', '');
    });

    it('should add third contact with phone but without name/email', () => {
        cy.get('[data-action="addContact"]').click({ force: true });
        cy.get('[name="name_Phonenumber0"]').type(CONTACTS.CONTACT_THREE_PHONE);
        addContactModal.submit();
        cy.get('.active > .navigation-link > .navigation-title').click();
    });
});

describe('Contacts to composer', () => {
    it('should compose an email to a contact without an email address', () => {
        cy.get(CONTACTS_GENERAL.CUSTOM_CHECK_BOX)
            .eq(2)
            .check();
        cy.get(COMPOSE_BUTTON).click();
        notification.error('Contact does not contain email address');
        cy.get(CONTACTS_GENERAL.CUSTOM_CHECK_BOX)
            .eq(2)
            .check();
    });
});

describe('Edit contacts', () => {
    it('should check third contact details', () => {
        cy.get(CONTACT_LIST_VIEW.CONTACT_LIST_NAME)
            .last()
            .should('contain', 'Unknown')
            .click();
        cy.get(CONTACT_LIST_VIEW.CONTACT_VIEW_DETAIL).should('not.contain', 'Email');
        cy.get(CONTACT_LIST_VIEW.CONTACT_VIEW_NAME).should('contain', 'Unknown');
        cy.get(CONTACT_LIST_VIEW.CONTACT_VIEW_PHONE).should('contain', CONTACTS.CONTACT_THREE_PHONE);
    });

    it('should edit contact from contact view', () => {
        cy.get('.fa-pencil').click();
        cy.get('[name="name_Name0"]').clear();
        cy.get('[name="name_Name0"]').type(CONTACTS.CONTACT_THREE_NAME);
        cy.get('[name="name_Emailaddress0"]').type(CONTACTS.CONTACT_THREE_EMAIL);
        cy.get('.fa-save').click();
        cy.wait(2000);
        notification.success('Contact edited');
    });

    it('should verify edits have been saved', () => {
        cy.get(CONTACT_LIST_VIEW.CONTACT_VIEW_NAME).should('contain', CONTACTS.CONTACT_THREE_NAME);
        cy.get(CONTACT_LIST_VIEW.CONTACT_VIEW_EMAIL).should('contain', CONTACTS.CONTACT_THREE_EMAIL);
    });

    it('should test going back and forward functionality', () => {
        cy.get('.contactActionHeader-title').should('exist');
        cy.get('.contactDetails-back').click();
        cy.get('.contactActionHeader-title').should('not.exist');
        cy.get(CONTACT_LIST_VIEW.CONTACT_LIST_NAME)
            .last()
            .click();
        cy.get('.contactActionHeader-title').should('exist');
    });

    it('should delete contact from advanced view', () => {
        deleteContactModal.isOpen(false);
        cy.get('.contactDetails-delete').click();
        deleteContactModal.isOpen();
        deleteContactModal.submit();
        cy.get(CONTACT_LIST_VIEW.CONTACT_LIST_NAME)
            .eq(3)
            .should('not.contain', CONTACTS.CONTACT_THREE_NAME);
        cy.get(CONTACT_LIST_VIEW.CONTACT_LIST_EMAIL)
            .eq(3)
            .should('not.contain', CONTACTS.CONTACT_THREE_EMAIL);
    });

    it('should auto-redirect to contact list', () => {
        cy.url().should('include', '/contacts');
    });
});

describe('Multiple contact selection', () => {
    it('should check a contact', () => {
        cy.get(CONTACTS_GENERAL.CUSTOM_CHECK_BOX)
            .eq(1)
            .check();
        cy.get(CONTACTS_GENERAL.CUSTOM_CHECK_BOX)
            .eq(1)
            .should('be.checked');
    });

    it('should recipients should be added to the composer', () => {
        cy.get(COMPOSE_BUTTON).click();
        cy.get('.composer-input-recipient').should('contain', CONTACTS.CONTACT_ONE_NAME);
        cy.get(CLOSE_BUTTON).click();
    });

    it('should re-add the third contact with all fields', () => {
        cy.get('[data-action="addContact"]').click({ force: true });
        cy.get('[name="name_Name0"]').type(CONTACTS.CONTACT_THREE_NAME);
        cy.get('[name="name_Emailaddress0"]').type(CONTACTS.CONTACT_THREE_EMAIL);
        cy.get('[name="name_Phonenumber0"]').type(CONTACTS.CONTACT_THREE_PHONE);
        addContactModal.submit();
        cy.get('.active > .navigation-link > .navigation-title').click();
        cy.get(CONTACT_LIST_VIEW.CONTACT_LIST_NAME)
            .last()
            .should('contain', CONTACTS.CONTACT_THREE_NAME);
        cy.get(CONTACT_LIST_VIEW.CONTACT_LIST_EMAIL)
            .last()
            .should('contain', CONTACTS.CONTACT_THREE_EMAIL);
    });

    it('should select the first and last contact', () => {
        cy.get(CONTACTS_GENERAL.CUSTOM_CHECK_BOX)
            .eq(1)
            .check();
        cy.get(CONTACTS_GENERAL.CUSTOM_CHECK_BOX)
            .eq(3)
            .check();
    });

    it('should test compose function on dual selection', () => {
        cy.get(COMPOSE_BUTTON).click();
        cy.get('.composer').should('exist');
        cy.get('.composer-input-recipient').should('contain', CONTACTS.CONTACT_ONE_NAME);
        cy.wait(1000);
        cy.get(CLOSE_BUTTON).click();
        cy.get('.composer').should('not.exist');
    });

    it('should test deselect checkbox', () => {
        cy.get(CONTACTS_GENERAL.CUSTOM_CHECK_BOX)
            .eq(0)
            .check();
        cy.get(CONTACTS_GENERAL.CUSTOM_CHECK_BOX)
            .eq(0)
            .uncheck();
        cy.get(CONTACTS_GENERAL.CUSTOM_CHECK_BOX)
            .eq(0)
            .should('not.have.attr', 'checked');
        cy.get(CONTACTS_GENERAL.CUSTOM_CHECK_BOX)
            .eq(1)
            .should('not.have.attr', 'checked');
        cy.get(CONTACTS_GENERAL.CUSTOM_CHECK_BOX)
            .eq(2)
            .should('not.have.attr', 'checked');
    });
});

describe('Delete contacts', () => {
    it('should delete first contact', () => {
        cy.get(CONTACTS_GENERAL.CUSTOM_CHECK_BOX)
            .eq(1)
            .check();
        deleteContactModal.isOpen(false);
        cy.get(DELETE_BUTTON).click();
        deleteContactModal.isOpen();
        deleteContactModal.submit();
        cy.wait(2000);
        notification.success('Contact deleted');
    });

    it('should delete all contacts', () => {
        deleteAllContactsModal.isOpen(false);
        cy.get('[data-action="deleteContacts"]').click();
        deleteAllContactsModal.isOpen();
        deleteAllContactsModal.submit();
        cy.wait(2000);
        notification.success('All contacts deleted');
    });

    it('should check if all contacts have been removed', () => {
        cy.get('contactList-container').should('not.have.class', CONTACT_LIST_VIEW.CONTACT_VIEW_NAME);
    });
});
