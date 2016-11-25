const find = () => element(by.css('.proton-notification-template'));
const message = (name) => {
    return browser.executeScript(`
        return $('.proton-notification-template')
            .find('span')
            .html();
    `);
};

module.exports = { find, message };
