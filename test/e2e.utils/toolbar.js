const SELECTOR = {
    container: '#pm_toolbar-desktop',
    allElements: '.toolBar-select-all',
    read: '.readUnread-btn-read',
    unread: '.readUnread-btn-unread',
    buttons: {
        trash: '.toolbar-btn-trash',
        inbox: '.toolbar-btn-inbox',
        archive: '.toolbar-btn-archive',
        spam: '.toolbar-btn-spam',
        delete: '.toolbar-btn-delete',
        layout: {
            column: '.chooseLayoutBtns-btn-column',
            rows: '.chooseLayoutBtns-btn-rows'
        }
    }
};

const selectAll = () => {
    return browser.executeScript(`
        const $checkbox = $('${SELECTOR.container}')
            .find('${SELECTOR.allElements}');

        $checkbox.click();
        return $checkbox[0].checked;
    `);
};

const read = (is = true) => {
    const selector = is ? SELECTOR.read : SELECTOR.unread;
    return browser.executeScript(`
        $('${SELECTOR.container}')
            .find('${selector}')
            .click()
    `);
};

const moveTo = (key = 'trash') => {
    const selector = SELECTOR.buttons[key];

    return browser.executeScript(`
        $('${SELECTOR.container}')
            .find('${selector}')
            .click();
    `);
};

const layout = (key = 'column') => {
    const selector = SELECTOR.buttons.layout[key];

    return browser.executeScript(`
        $('${SELECTOR.container}')
            .find('${selector}')
            .click();
    `);
};

module.exports = { selectAll, read, moveTo, layout };
