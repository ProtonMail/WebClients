// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add("login", (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This is will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })
const notification = require('./helpers/notification.cy');
const mockEvent = require('./helpers/mockEvent.cy');
const modalTest = require('./helpers/modals.cy');

const discardModal = modalTest({
    title: 'Delete',
    message: 'Permanently delete this draft?'
});
const TITLE_MAP = {
    allmail: 'All Mail',
    inbox: 'Inbox',
    search: 'Search',
    drafts: 'Drafts',
    sent: 'Sent',
    starred: 'Starred',
    archive: 'Archive',
    spam: 'Spam',
    trash: 'Trash'
};
const getTitle = (input) => `${TITLE_MAP[input]} ${Cypress.env('login1')}@protonmail.blue | ProtonMail`;

Cypress.Commands.add('login', (unlock, username) => {
    if (!unlock) {
        cy.visit(Cypress.env('server'));
        cy.url().should('include', '/login');
        cy.get('#username').type(username || Cypress.env('login1'));
        cy.get('#password').type(Cypress.env('password1'));

        cy.get('#login_btn').click({ timeout: 5000 });
        cy.url().should('include', '/inbox');
        return cy.get('.search-form-fieldset-input');
    }

    cy.visit(Cypress.env('server'));
    cy.url().should('include', '/login');

    cy.get('#username').type(username || Cypress.env('login2'));
    cy.get('#password').type(Cypress.env('password2'));
    cy.get('#login_btn').click({ timeout: 5000 });
    cy.url().should('include', '/login/unlock');
    cy.get('[name="mailbox-password"]').type(Cypress.env('unlockpassword2'));
    cy.get('#unlock_btn').click();
    cy.url().should('include', '/inbox');
    cy.get('.search-form-fieldset-input');
});

Cypress.Commands.add('logout', () => {
    cy.get('.navigation-link.navigationUser-link').click();
    cy.server();
    cy.route('DELETE', /api\/auth/).as('killSession');
    cy.get('.navigationUser-logout').click();
    cy.wait('@killSession');
    cy.url().should('include', '/login');
});

/**
 * @link https://github.com/cypress-io/cypress/issues/757#issuecomment-337676399
 */
Cypress.Commands.add('selectOption', (country, selector = '#country') => {
    cy.get(selector)
        .then(($select) => {
            const opt = $select.find(`option[label="${country}"]`);
            $select.val(opt.attr('value'));
            return $select;
        })
        .trigger('change');
});

Cypress.Commands.add('compose', () => {
    cy.get('.composer').should('not.exist');
    cy.get('.compose.pm_button').click();
    cy.get('.composer').should('exist');
});

Cypress.Commands.add('clickBack', () => {
    cy.get('.sidebar-btn-back').should('exist');
    cy.get('.sidebar-btn-back').click();
    cy.wait(500);
    cy.get('.sidebar-btn-back').should('not.exist');
});

Cypress.Commands.add('sendMessage', (subject, error = false) => {
    if (subject) {
        cy.get('.composer [ng-model="message.Subject"]').type(subject);
        cy.get('.composerHeader-subject').contains(subject);
    } else {
        cy.get('.composerHeader-subject').contains('New message');
    }

    cy.get('.btnSendMessage-btn-action').click();

    if (subject && !error) {
        cy.wait(500);
        cy.get('.composer').should('not.exist');
        notification.success('Message sent');
    }
});

Cypress.Commands.add('deleteDraft', (scope = '') => {
    cy.get(`${scope} .composer-btn-discard`.trim()).click();
    discardModal.submit();
    discardModal.isOpen(false);
    cy.wait(500);

    notification.success('Message discarded');
    cy.get(`.composer${scope}`.trim()).should('not.exist');
});

Cypress.Commands.add('navigate', (selector, url) => {
    cy.get(`.navigationItem-item[data-state="${selector || selector}"]`).click();
    cy.url().should('include', `/${url || selector}`);
    cy.title().should('match', new RegExp(`${getTitle(url || selector)}$`));
});

Cypress.Commands.add('dropFile', (fileName) => {
    const [, ext] = fileName.split('.');
    const type = `image/${ext === 'jpg' ? 'jpeg' : ext}`;
    return cy.fixture(`../media/${fileName}`).then((blob) => mockEvent.getDropEvent([{ blob, fileName, type }]));
});
