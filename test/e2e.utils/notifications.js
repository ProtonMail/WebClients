const find = () => element(by.css('.proton-notification-template'));
const message = (type = '') => {

    const className = type ? `.notification-${type}` : '';
    return browser.executeScript(`
        return $('.proton-notification-template${className}')
            .find('span')
            .html();
    `);
};

module.exports = { find, message };
