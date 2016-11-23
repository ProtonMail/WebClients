const openLabel = (name) => {
    return browser.executeScript(`
        $('#sidebarLabels')
            .find('.labels')
            .find('a[title="${name}"]')
            .click();
    `);
};



module.exports = {
    openLabel
};
