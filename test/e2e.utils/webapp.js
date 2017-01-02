const SELECTOR = {
    layout: {
        rows: '.chooseLayoutBtns-container-rows',
        column: '.chooseLayoutBtns-container:not(.chooseLayoutBtns-container-rows)'
    }
};

const isLayout = (key = 'column') => {
    const selector = SELECTOR.layout[key];

    return browser.executeScript(`
        return !!document.body.querySelector('${selector}');
    `);
};

const openLabel = (name) => {
    return browser.executeScript(`
        $('#sidebarLabels')
            .find('.labels')
            .find('a[title="${name}"]')
            .click();
    `);
};

module.exports = {
    openLabel, isLayout
};
