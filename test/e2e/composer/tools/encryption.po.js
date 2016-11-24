module.exports = () => {

    const SELECTOR = {
        container: '.composer-options-encryption',
        button: '.composer-btn-encryption',
        cancel: '.composer-options-btn-cancel',
        password: '[name="outsidePw"]',
        confirm: '[name="outsidePwConfirm"]',
        hint: '[name="outsidePwHint"]'
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

    const fillInput = (key, value) => {
        const input = SELECTOR[key];
        return browser.executeScript(`
            const $form = $(document.body.querySelector('.composer'))
                .find('${SELECTOR.container}');

            const $input = $form.find('input${input}');
            $input.val('${value}');
            $input.triggerHandler('input');
            return $input.val();
        `);
    };

    const isInvalidInput = (key) => {
        const input = SELECTOR[key];
        return browser.executeScript(`
            const $form = $(document.body.querySelector('.composer'))
                .find('${SELECTOR.container}');

            const $input = $form.find('input${input}');
            return $input.hasClass('ng-invalid');
        `);
    };

    const isDisabledSubmit = () => {
        return browser.executeScript(`
            return $(document.body.querySelector('.composer'))
                .find('${SELECTOR.container}')
                .find('.composer-options-btn-submit')
                .is(':disabled');
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
        fillInput,
        submit,
        isInvalidInput,
        isDisabledSubmit
    };

};
