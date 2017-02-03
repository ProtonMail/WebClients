module.exports = () => {

    const SELECTOR = {
        container: '.searchForm-container',
        input: '.search-form-fieldset-input',
        submit: '.searchForm-action-button-default',
        toggle: '.searchForm-action-button-toggle',
        nothing: '#nothingToSeeHere',
        advanced: {
            container: '.searchForm-advanced-container',
            keyword: '#search_keywords',
            sender: '#search_sender',
            recipient: '#search_recipient',
            start: '#search_start',
            end: '#search_end',
            address: '#search_address option:selected',
            label: '#search_folder option:selected',
            attachment: {
                all: '.customRadio-input[value="2"]',
                yes: '.customRadio-input[value="1"]',
                no: '.customRadio-input[value="0"]'
            },
            submit: '[type="submit"]'
        }
    };

    const getSelector = (key) => `$(document.body.querySelector('${SELECTOR.container}')).find('${key}')`;

    const inputValue = (input, value) => `const $input = ${input};
        $input.val('${value}');
        $input.triggerHandler('input');
        $input.triggerHandler('change');`

    const simple = () => {
        const input = getSelector(SELECTOR.input);

        const isVisible = () => {
            return browser.executeScript(`
                return ${input}
                    .is(':visible');
            `);
        };

        const search = (value) => {
            return browser.executeScript(inputValue(input, value));
        };

        const cancel = () => {

            browser.executeScript(`
                const $input = ${input};
                $input.click();
                $input.triggerHandler('focus');
            `)
                .then(() => {
                    $(SELECTOR.input).sendKeys(protractor.Key.ESCAPE);
                });
        };

        const getValue = () => {
            return browser.executeScript(`
                return ${input}.val()
            `);
        };

        const submit = () => {
            return browser.executeScript(`
                ${getSelector(SELECTOR.submit)}.click();
            `);
        };

        return { isVisible, getValue, search, submit, cancel };
    };

    const advanced = () => {

        const container = getSelector(SELECTOR.advanced.container);

        const toggle = () => {
            return browser.executeScript(`
                ${getSelector(SELECTOR.toggle)}.click();
            `);
        };

        const isVisible = () => {
            return browser.executeScript(`
                return ${container}
                    .is(':visible');
            `);
        };

        const custom = (value) => {
            const getInput = (name) => `${container}.find('${SELECTOR.advanced[name]}')`
            const keyword = inputValue(getInput('keyword'), value);
            const sender = inputValue(getInput('sender'), 'polo');
            const recipient = inputValue(getInput('recipient'), 'polo');
            const start = inputValue(getInput('start'), '01/01/2017');
            const end = inputValue(getInput('end'), '02/01/2017');

            return browser.executeScript(`
                {${keyword}}
                {${recipient}}
                {${sender}}
                {${start}}
                {${end}}
            `);
        };

        const getValue = (name) => {
            return browser.executeScript(`
                return ${container}
                    .find('${SELECTOR.advanced[name]}')
                    .val();
            `);
        };
        const submit = () => {
            return browser.executeScript(`
                ${container}.find('${SELECTOR.advanced.submit}').click();
            `);
        };

        return { isVisible, toggle, getValue, custom, submit };
    };

    const isEmpty = () => {
        return browser.executeScript(`
            return $('${SELECTOR.nothing}')
                .is(':visible');
        `);
    };

    return { simple: simple(), advanced: advanced(), isEmpty };
};
