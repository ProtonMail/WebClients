const buttons = () => ({
  cancel: element(by.id('cancelModalBtn')),
  confirm: element(by.id('confirmModalBtn'))
});

const message = () => element(by.css('.modal-body div')).getText();

const isVisible = () => {
    return browser.executeScript(`
        return $('.modal-dialog').is(':visible');
    `);
};

const cancel = () => {
    return browser.executeScript(`
        return $('.modal-dialog').find('#cancelModalBtn').click();
    `);
};

const confirm = () => {
    return browser.executeScript(`
        return $('.modal-dialog').find('#confirmModalBtn').click();
    `);
};

const read = () => {
    return browser.executeScript(`
        return $('.modal-dialog')
            .find('.modal-body')
            .find('.alert')
            .text();
    `);
};

module.exports = {
    buttons,
    message,
    isVisible,
    cancel,
    confirm,
    read
};
