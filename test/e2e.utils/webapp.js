const SELECTOR = {
    header: {
        container: '#pm_headerDesktop',
        settings: '#tour-settings'
    },
    settings: {
        container: '.settingsMenu-container',
        dashboard: '.navigationSettings-is-dashboard > .navigationSettings-link',
        account: '.navigationSettings-is-account > .navigationSettings-link',
        labels: '.navigationSettings-is-labels > .navigationSettings-link',
        filters: '.navigationSettings-is-filters > .navigationSettings-link',
        security: '.navigationSettings-is-security > .navigationSettings-link',
        appearance: '.navigationSettings-is-appearance > .navigationSettings-link',
        addresses: '.navigationSettings-is-addresses > .navigationSettings-link',
        domains: '.navigationSettings-is-domains > .navigationSettings-link',
        members: '.navigationSettings-is-members > .navigationSettings-link',
        payments: '.navigationSettings-is-payments > .navigationSettings-link',
        keys: '.navigationSettings-is-keys > .navigationSettings-link',
        vpn: '.navigationSettings-is-vpn > .navigationSettings-link',
        donate: '.settingsMenu-item-donate'
    },
    layout: {
        rows: '.chooseLayoutBtns-container-rows',
        column: '.chooseLayoutBtns-container:not(.chooseLayoutBtns-container-rows)'
    }
};

const goToMenu = (name = '', origin = 'settings') => {
    const selector = SELECTOR[origin][name];
    const container = SELECTOR[origin].container;
    return browser.executeScript(`
        $('${container}')
            .find('${selector}')
            .click();
    `);
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
    openState, openLabel, isLayout, goToMenu
};
