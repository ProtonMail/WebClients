module.exports = () => {

    const SELECTOR = {
        toolbarBtn: '.squireToolbar-action-link',
        popoverInput: 'input[type="url"]',
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

    const submit = () => {
        return browser.executeScript(`$('${SELECTOR.formAddPopover}').find('${SELECTOR.btnAddPopover}').click();`)
    };

    const matchIframe = (value) => {
        return browser.executeScript(`
            const img = $(document.body.querySelector('.composer'))
                .find('.angular-squire-wrapper')
                .find('iframe')[0]
                .contentDocument
                .body
                .querySelector('a[href="${value}"]');
            return (img && img.href === '${value}');
        `);
    };


    return {
        openForm,
        bindLink,
        submit,
        isVisible,
        matchIframe
    };

}
