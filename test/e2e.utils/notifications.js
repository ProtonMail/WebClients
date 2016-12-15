const find = () => element(by.css('.proton-notification-template'));
const message = (type = '') => {

    const className = type ? `.notification-${type}` : '';
    return browser.executeScript(`
        return $('.proton-notification-template${className}')
            .find('span')
            .html();
    `);
};

const containsMessage = (message, type = '') => {
    const className = type ? `.notification-${type}` : '';
    return browser.executeScript(`
        return [].slice.call($('.proton-notification-template${className}'))
            .map((node) => node.querySelector('span').innerHTML)
            .indexOf('${message}') > -1;
    `);
};

const isOpened = (type = '') => {

    const className = type ? `.notification-${type}` : '';
    return browser.executeScript(`
        return $('.proton-notification-template${className}')
            .get(0) !== null;
    `);
};

module.exports = { find, message, isOpened, containsMessage };
