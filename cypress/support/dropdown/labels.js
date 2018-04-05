const { addLabel, addFolder } = require('../modals/colorModal');
const { hexToRgb } = require('../helpers/string.cy');

const noop = () => {};

const tests = (type = 'label', api = noop) => (toolbar = true) => {
    const selector = (scope = `.dropdown-${type}-container`) => (item = '') => `${scope} ${item}`.trim();
    const get = selector(toolbar ? `.toolbarDesktop-dropdown-${type}s` : void 0);

    const isOpen = (test = true) => {
        const is = !test ? 'not.' : '';
        cy.get(get()).should(`${is}be.visible`.trim());
    };

    const open = () => {
        cy.get(`.toolbarDesktop-select-${type}`).click();
        isOpen(true);
    };

    const close = () => {
        // cy.get(`.toolbarDesktop-select-${type}`).click();
        cy.get(`docucument.body`).click();
        isOpen(false);
    };

    const create = () => {
        const modal = (type === 'label' ? addLabel : addFolder)();
        const btn = type === 'label' ? '.createLabel-button' : '.dropdown-folder-create-button';
        modal.isOpen(false);
        cy.get(get(btn)).click();
        isOpen();
        modal.isOpen();
        return modal;
    };

    return Object.assign({ isOpen, create, open, close }, api(get));
};

function labels(get) {
    const isEmpty = (test = true) => {
        const alert = '.dropdown-label-title .alert-info';
        const title = '.dropdown-label-title-hasLabels';

        if (!test) {
            cy.get(get(alert)).should('not.be.visible');
            cy.get(get(title)).should('be.visible');
            cy.get(get(title)).should('contain', 'Label as');
            cy.get(get('.dropdown-label-search-input')).should('be.visible');
            cy.get(get('.dropdown-label-alsoArchive')).should('be.visible');
            cy.get(get('.dropdown-label-apply')).should('be.visible');
            cy.get(get('.dropdown-label-create')).should('be.visible');
            cy.focused().should('have.class', 'dropdown-label-search-input');
            return cy.get(get('.scrollbox-container-group-item')).should('exist');
        }

        cy.get(get(alert)).should('be.visible');
        cy.get(get(alert)).should('contain', 'No labels');
        cy.get(get(title)).should('not.be.visible');
        cy.get(get('.dropdown-label-create')).should('be.visible');
        cy.get(get('.dropdown-label-search-input')).should('not.be.visible');
        cy.get(get('.dropdown-label-alsoArchive')).should('not.be.visible');
        cy.get(get('.dropdown-label-apply')).should('not.be.visible');
        cy.get(get('.scrollbox-container-group-item')).should('not.exist');
    };

    const hasLabel = (label, color) => {
        const item = cy.get(get('.scrollbox-container-group-item'));
        const txt = item.get('.dropdown-label-scrollbox-label-text-ellipsis').contains(label);
        const icon = txt.parent('span');
        icon.should('have.attr', 'style', `color: ${hexToRgb(color)};`);
        txt.should('exist');
    };

    return { isEmpty, hasLabel };
}

function folders(get) {
    const checkDefault = (total = 4) => {
        const title = '.dropdown-folder-title';
        cy.get(get(title)).should('be.visible');
        cy.get(get(title)).should('contain', 'Move to');
        cy.get(get('.dropdown-folder-scrollbox-group-item')).should('have.length', total);
        cy.get(get('.dropdown-folder-create-button')).should('be.visible');
        cy
            .get(get('.dropdown-folder-scrollbox-group-item-button span'))
            .contains('Inbox')
            .should('exist');
        cy
            .get(get('.dropdown-folder-scrollbox-group-item-button span'))
            .contains('Archive')
            .should('exist');
        cy
            .get(get('.dropdown-folder-scrollbox-group-item-button span'))
            .contains('Spam')
            .should('exist');
        cy
            .get(get('.dropdown-folder-scrollbox-group-item-button span'))
            .contains('Trash')
            .should('exist');
        cy.get(get('.dropdown-folder-search-input')).should('be.visible');
    };

    const hasFolder = (folder, color, total = 5) => {
        checkDefault(total);
        const item = cy.get(get('.dropdown-folder-scrollbox-group-item'));
        const txt = item.get('span').contains(folder);

        cy.get(get(`.dropdown-folder-scrollbox-group-item i[style="color: ${hexToRgb(color)};"]`)).should('exist');
        txt.should('exist');
    };

    return { checkDefault, hasFolder };
}

module.exports = {
    toolbarLabel: tests('label', labels)(true),
    toolbarFolder: tests('folder', folders)(true)
};
