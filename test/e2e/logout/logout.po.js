module.exports = () => {
    return browser.executeScript(`
        const $dropdown = $('#pm_header-desktop')
            .find('.pm_buttons:last-child');
        $dropdown.find('.pm_trigger').click();
        $dropdown.find('a[ui-sref="login"]').click();
    `);
};
