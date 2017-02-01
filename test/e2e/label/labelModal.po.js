const modal = require('../../e2e.utils/modal');

const SELECTOR = {
    container: '.labelModal-container',
    input: {
        name: '.labelModal-input-name',
        color: '.labelModal-input-color'
    },
    button: {
        cancel: '.labelModal-btn-cancel',
        save: '.labelModal-btn-save'
    }
};

const form = () => {

    const getSelector = (key) => `$(document.body.querySelector('${SELECTOR.container}')).find('${key}')`;

    const setName = (value) => {
        return browser.executeScript(`
            const $input = ${getSelector(SELECTOR.input.name)};
            $input.val('${value}');
            $input.triggerHandler('input');
            $input.triggerHandler('change');
        `);
    };

    const chooseColor = (i = 0) => {
        return browser.executeScript(`
            const $input = ${getSelector(SELECTOR.input.color)}.eq(${i});
            $input.get(0).click();
            return $input.val();
        `);
    };

    const submit = () => {
        return browser.executeScript(`
            ${getSelector(SELECTOR.button.save)}.click();
        `);
    };

    const cancel = () => {
        return browser.executeScript(`
            ${getSelector(SELECTOR.button.cancel)}.click();
        `);
    };

    return { setName, chooseColor, submit, cancel };
};


module.exports = { modal, form };
