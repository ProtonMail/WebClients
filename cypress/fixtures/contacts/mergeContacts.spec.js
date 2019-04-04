import * as contactActions from '../../support/helpers/contactActions.cy';

import {
    CONTACTS,
    MERGE_CONTACT_MODAL,
    CONTACT_LIST_VIEW,
    CONTACTS_GENERAL
} from '../../support/helpers/contactList.cy';

const notification = require('../../support/helpers/notification.cy');

const MERGE_BUTTON = '.merge';

const notificationCheck = () => {
    cy.get('h1.ng-binding').should('contain', '2 of 2');
    cy.get('.contactLoaderModal-frame > strong.ng-binding').should('contain', 'contacts successfully merged');
};

it('should redirect to the contacts state', () => {
    contactActions.openContactState();
});

describe('Merge contacts', () => {
    it('should import sample vcf file', function() {
        cy.get('[data-action="importContacts"]').click();

        cy.dndFile('proton.vcf', { wait: 5000 });

        contactActions.footerClick(MERGE_CONTACT_MODAL.PRIMARY_BUTTON);
        cy.wait(7000);
        contactActions.footerClick(MERGE_CONTACT_MODAL.PM_BUTTON);
    });

    it('should try to merge contacts via sidebar merge all button', () => {
        cy.get('.sidebarApp-link')
            .eq(3)
            .click();

        cy.get('.modal-title').should('contain', 'Merge contacts');

        contactActions.verifyContactBeforeMerge(MERGE_CONTACT_MODAL.MERGE_LIST_NAME, CONTACTS.CONTACT_THREE_NAME);
        contactActions.verifyContactBeforeMerge(MERGE_CONTACT_MODAL.MERGE_LIST_EMAIL, CONTACTS.CONTACT_THREE_EMAIL);

        contactActions.verifyContactBeforeMerge(
            MERGE_CONTACT_MODAL.MERGE_LIST_NAME,
            CONTACTS.CONTACT_THREE_NAME,
            false
        );
        contactActions.verifyContactBeforeMerge(
            MERGE_CONTACT_MODAL.MERGE_LIST_EMAIL,
            CONTACTS.CONTACT_THREE_EMAIL,
            false
        );

        cy.get('.contactMergerList-group-footer > .pm_button').should('not.have.attr', 'disabled');

        cy.get(CONTACTS_GENERAL.CUSTOM_CHECK_BOX)
            .eq(1)
            .uncheck();
        cy.get(CONTACTS_GENERAL.CUSTOM_CHECK_BOX)
            .eq(1)
            .should('not.have.attr', 'checked');
        cy.get('.contactMergerList-group-footer > .pm_button').should('have.attr', 'disabled');

        cy.get(CONTACTS_GENERAL.CUSTOM_CHECK_BOX)
            .eq(1)
            .check();
        cy.get(MERGE_CONTACT_MODAL.MERGE_LIST_PREVIEW).click();

        contactActions.verifyContactPreview('1', CONTACTS.CONTACT_THREE_NAME);
        contactActions.verifyContactPreview('2', CONTACTS.CONTACT_THREE_EMAIL);
        contactActions.verifyContactPreview('3', CONTACTS.CONTACT_THREE_PHONE);

        contactActions.footerClick(MERGE_CONTACT_MODAL.PRIMARY_BUTTON);

        notificationCheck();

        cy.wait(5000);

        contactActions.footerClick(MERGE_CONTACT_MODAL.PM_BUTTON);
    });

    it('should verify contacts have been merged', () => {
        cy.get(CONTACT_LIST_VIEW.CONTACT_LIST_NAME)
            .eq(2)
            .should('contain', CONTACTS.CONTACT_THREE_NAME);
        cy.get(CONTACT_LIST_VIEW.CONTACT_LIST_NAME)
            .eq(3)
            .should('contain', CONTACTS.CONTACT_FOUR_NAME);
    });

    it('should create a partial contact selection', () => {
        cy.get(CONTACTS_GENERAL.CUSTOM_CHECK_BOX)
            .eq(1)
            .check();
        cy.get(CONTACTS_GENERAL.CUSTOM_CHECK_BOX)
            .eq(1)
            .should('be.checked');
        cy.get(CONTACTS_GENERAL.CUSTOM_CHECK_BOX)
            .eq(3)
            .check();
        cy.get(CONTACTS_GENERAL.CUSTOM_CHECK_BOX)
            .eq(3)
            .should('be.checked');
    });

    it('should try to merge partial selection via top merge button', () => {
        cy.get(MERGE_BUTTON).click();

        cy.get('.modal-title').should('contain', 'Merge contacts');
        cy.get(MERGE_CONTACT_MODAL.MERGE_LIST_NAME)
            .first()
            .should('contain', CONTACTS.CONTACT_ONE_NAME);
        cy.get(MERGE_CONTACT_MODAL.MERGE_LIST_EMAIL)
            .first()
            .should('contain', CONTACTS.CONTACT_ONE_EMAIL);
        cy.get(MERGE_CONTACT_MODAL.MERGE_LIST_NAME)
            .last()
            .should('contain', CONTACTS.CONTACT_THREE_NAME);
        cy.get(MERGE_CONTACT_MODAL.MERGE_LIST_EMAIL)
            .last()
            .should('contain', CONTACTS.CONTACT_THREE_EMAIL);

        cy.get(MERGE_CONTACT_MODAL.MERGE_LIST_PREVIEW).click();

        cy.get(':nth-child(1) > .contactDisplay-item > .contactDisplay-item-value').should(
            'contain',
            CONTACTS.CONTACT_ONE_NAME
        );

        cy.get('[data-group="item1"] > .contactDisplay-item-value').should('contain', CONTACTS.CONTACT_ONE_EMAIL);
        cy.get('[data-group="item2"] > .contactDisplay-item-value').should('contain', CONTACTS.CONTACT_THREE_EMAIL);
        cy.get(':nth-child(3) > .contactDisplay-item > .contactDisplay-item-value').should(
            'contain',
            CONTACTS.CONTACT_THREE_PHONE
        );

        contactActions.footerClick(MERGE_CONTACT_MODAL.PRIMARY_BUTTON);

        notificationCheck();

        cy.wait(5000);

        contactActions.footerClick(MERGE_CONTACT_MODAL.PM_BUTTON);
    });

    it('should verify contacts have been merged', () => {
        cy.get(CONTACT_LIST_VIEW.CONTACT_LIST_NAME)
            .eq(0)
            .should('contain', CONTACTS.CONTACT_ONE_NAME);
        cy.get(CONTACT_LIST_VIEW.CONTACT_LIST_NAME)
            .eq(1)
            .should('contain', CONTACTS.CONTACT_TWO_NAME);
        cy.get(CONTACT_LIST_VIEW.CONTACT_LIST_NAME)
            .eq(2)
            .should('contain', CONTACTS.CONTACT_FOUR_NAME);
    });

    it('should check merge contact details screen', () => {
        cy.get(CONTACTS_GENERAL.CUSTOM_CHECK_BOX)
            .eq(1)
            .check();
        cy.get(CONTACTS_GENERAL.CUSTOM_CHECK_BOX)
            .eq(2)
            .check();
        cy.get(MERGE_BUTTON).click();
        cy.get('[pt-tooltip="Contact details"]')
            .first()
            .click();

        contactActions.verifyContactPreview('1', CONTACTS.CONTACT_THREE_NAME);
        contactActions.verifyContactPreview('2', CONTACTS.CONTACT_THREE_EMAIL);

        contactActions.footerClick(MERGE_CONTACT_MODAL.PRIMARY_BUTTON);
    });

    it('should try to remove contact from merge screen', () => {
        cy.get('[pt-tooltip="Delete"]')
            .first()
            .click();
        cy.get(MERGE_CONTACT_MODAL.MERGE_LIST_NAME)
            .last()
            .should('contain', CONTACTS.CONTACT_THREE_NAME);
        cy.get(MERGE_CONTACT_MODAL.MERGE_LIST_EMAIL)
            .last()
            .should('contain', CONTACTS.CONTACT_THREE_EMAIL);
    });

    it('should undo remove', () => {
        cy.get('[pt-tooltip="Undo"]')
            .last()
            .click();
        cy.get(MERGE_CONTACT_MODAL.MERGE_LIST_NAME)
            .last()
            .should('contain', CONTACTS.CONTACT_THREE_NAME);
        cy.get(MERGE_CONTACT_MODAL.MERGE_LIST_EMAIL)
            .last()
            .should('contain', CONTACTS.CONTACT_THREE_EMAIL);
    });

    it('should try to merge a single contact', () => {
        cy.get('[pt-tooltip="Delete"]')
            .last()
            .click();
        cy.get('.modal-footer > .primary')
            .first()
            .click({ force: true });
        cy.get('.contactLoaderModal-frame > strong.ng-binding').should('not.contain', 'contacts successfully merged');
        cy.wait(5000);
        contactActions.footerClick(MERGE_CONTACT_MODAL.PM_BUTTON);
    });

    it('should delete all contacts', () => {
        cy.get('[data-action="deleteContacts"]').click();
        cy.get('#confirmModalBtn').click();
        cy.wait(2000);
        notification.success('All contacts deleted');
    });
});