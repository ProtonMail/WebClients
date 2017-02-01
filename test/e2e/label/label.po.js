module.exports = () => {

    const SELECTOR = {
        container: '#labelContainer',
        list: {
            container: '.labelsState-list',
            item: '.labelsState-item',
            text: '.labelsState-item-name'
        },
        button: {
            add: '.labelsState-btn-add',
            edit: '.labelsState-btn-edit',
            delete: '.labelsState-btn-delete'
        },
        message: {
            info: '.labelsState-msg-info'
        }
    };

    const scope = () => `$(document.body.querySelector('${SELECTOR.container}'))`;

    const messages = (name = 'info') => {
        const key = SELECTOR.message[name];
        const selector = `${scope()}.find('${key}')`;

        const isVisible = () => {
            return browser.executeScript(`
                return ${selector}.is(':visible');
            `);
        };

        const content = () => {
            return browser.executeScript(`
                return ${selector}.text();
            `);
        };

        return { isVisible, content };
    };

    const list = () => {
        const selector = `${scope()}.find('${SELECTOR.list.container}')`;

        const isVisible = () => {
            return browser.executeScript(`
                return ${selector}.is(':visible');
            `);
        };

        const length = () => {
            return browser.executeScript(`
                return ${selector}.find('${SELECTOR.list.item}').length;
            `);
        };

        const item = (index = 0) => {
            const itemSelector = `${selector}.find('${SELECTOR.list.item}').eq(${index})`;

            const edit = () => {
                return browser.executeScript(`
                    return ${itemSelector}.find('${SELECTOR.button.edit}').click();
                `);
            };

            const remove = () => {
                return browser.executeScript(`
                    return ${itemSelector}.find('${SELECTOR.button.delete}').click();
                `);
            };

            const content = () => {
                return browser.executeScript(`
                    return ${itemSelector}.find('${SELECTOR.list.text}').text();
                `);
            };

            const getColor = () => {
                return browser.executeScript(`
                    return ${itemSelector}.attr('data-color');
                `);
            };

            return { edit, remove, content, getColor };
        };

        return { isVisible, length, item };
    };

    const add = () => {
        const selector = SELECTOR.button.add;
        return browser.executeScript(`
            return ${scope()}.find('${selector}').click();
        `);
    };


    return { messages, list, add };

};
