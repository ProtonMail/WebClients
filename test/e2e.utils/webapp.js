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

const openState = (state = '') => {
    browser.ignoreSynchronization = true;
    browser.get(`http://localhost:8080/${state}`);
    browser.waitForAngular();
    return browser.wait(() => {
        return browser.getCurrentUrl()
            .then((url) => url.indexOf(`${state}`) !== -1);
    }, 10000);
};

module.exports = {
    openState, openLabel, isLayout
};
