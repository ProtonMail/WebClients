module.exports = () => {

    const SELECTOR = {
        container: '.composer-options-expiration',
        button: '.composer-btn-expiration',
        cancel: '.composer-options-btn-cancel',
        week: '.composer-options-select-week',
        day: '.composer-options-select-day',
        hour: '.composer-options-select-hour'
    };

    const open = () => {
        return browser.executeScript(`
            $(document.body.querySelector('.composer'))
                .find('${SELECTOR.button}')
                .click();
        `);
    };

    const cancel = () => {
        return browser.executeScript(`
            $(document.body.querySelector('.composer'))
                .find('${SELECTOR.container}')
                .find('${SELECTOR.cancel}')
                .click();
        `);
    };

    const isVisible = () => {
        return browser.executeScript(`
            return $(document.body.querySelector('.composer'))
                .find('${SELECTOR.container}')
                .is(':visible');
        `);
    };

    const setValue = (key, index = 0) => {
        const select = SELECTOR[key];
        return browser.executeScript(`
            const $form = $(document.body.querySelector('.composer'))
                .find('${SELECTOR.container}');

            const $select = $form.find('${select}');
            $select.find('option').get(${index});
            $select.selected = true;
            $select.get(0).selectedIndex = ${index};
            $select.change();
        `);
    };

    const getValues = () => {

        return browser.executeScript(`
            const $select = $(document.body.querySelector('.composer'))
                .find('${SELECTOR.container}')
                .find('[class*="composer-options-select"]');

            return [].slice.call($select)
                .reduce((acc, node) => (acc[node.name] = node.selectedIndex, acc), {});
        `);
    };

    const submit = () => {
        return browser.executeScript(`
            $(document.body.querySelector('.composer'))
                .find('${SELECTOR.container}')
                .find('.composer-options-btn-submit')
                .click();
        `);
    };


    const isActive = () => {
        return browser.executeScript(`
            return $(document.body.querySelector('.composer'))
                .find('${SELECTOR.button}')
                .hasClass('primary');
        `);
    };


    return {
        open,
        cancel,
        isVisible,
        isActive,
        setValue,
        getValues,
        submit
    };

};
