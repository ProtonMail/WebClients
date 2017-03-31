module.exports = () => {

    const SELECTOR = {
        toolbarBtn: '.squireToolbar-action-link',
        popoverLabel: '#labelLink',
        popoverInput: '#urlLink',
        formAddPopover: '.addLinkPopover-container',
        btnAddPopover: '.addLinkPopover-btn-new'
    };

    const isVisible = () => {
        return browser.executeScript(`
            return $('${SELECTOR.formAddPopover}').is(':visible')
        `);
    }

    const openForm = () => {
        return browser.executeScript(`$('${SELECTOR.toolbarBtn}').click();`);
    };

    const bindLink = (link) => {
        return browser.executeScript(`
            const $input = $('${SELECTOR.formAddPopover}').find('${SELECTOR.popoverInput}');
            $input.val('${link}');
            $input.triggerHandler('input');
        `);
    };

    const bindLabel = (label) => {
        return browser.executeScript(`
            const $input = $('${SELECTOR.formAddPopover}').find('${SELECTOR.popoverLabel}');
            $input.val('${label}');
            $input.triggerHandler('input');
        `);
    };

    const readInput = () => {
        return browser.executeScript(`
            return {
                label: $('${SELECTOR.formAddPopover}').find('${SELECTOR.popoverLabel}').val(),
                link: $('${SELECTOR.formAddPopover}').find('${SELECTOR.popoverInput}').val()
            };
        `);
    };

    const submit = () => {
        return browser.executeScript(`$('${SELECTOR.formAddPopover}').find('${SELECTOR.btnAddPopover}').click();`);
    };

    const matchIframe = (href, link = '') => {
        return browser.executeScript(`
            const img = $(document.body.querySelector('.composer'))
                .find('.angular-squire-wrapper')
                .find('iframe')[0]
                .contentDocument
                .body
                .querySelector('a[href="${href}"]');

            if ('${link}') {
                return (img && img.href === '${href}' && img.textContent === '${link}');
            }
            return (img && img.href === '${href}');
        `);
    };


    return {
        openForm,
        bindLink,
        bindLabel,
        submit,
        isVisible,
        matchIframe,
        readInput
    };

};
