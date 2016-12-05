const find = () => element(by.css('.proton-notification-template'));
const message = (type = '') => {

    const className = type ? `.notification-${type}` : '';
    return browser.executeScript(`
        return $('.proton-notification-template${className}')
            .find('span')
            .html();
    `);
};

const isOpened = (type = '') => {

    const className = type ? `.notification-${type}` : '';
    return browser.executeScript(`
        return $('.proton-notification-template${className}')
            .get(0) !== null;
    `);
};

module.exports = { find, message, isOpened };
