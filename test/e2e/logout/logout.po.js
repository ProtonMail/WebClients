module.exports = () => {
    return browser.executeScript(`
        $('.navigationUser > a').click()
        $('.pm_dropdown.navigationUser-dropdown').find('a[ui-sref="login"]').click();
    `);
};
