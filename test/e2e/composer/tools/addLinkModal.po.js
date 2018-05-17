module.exports = () => {

    const SELECTOR = {
        toolbarBtn: '.squireToolbar-action-link',
        container: '.addLink-container',
        labelInput: '.addLink-labelLinkInput',
        urlInput: '.addLink-urlLinkInput',
        btnInsert: '.addLink-insert-button'
    };

    const isVisible = () => {
        return browser.executeScript(`
            return $('${SELECTOR.container}').is(':visible')
        `);
    };

    const openModal = () => {
        return browser.executeScript(`$('${SELECTOR.toolbarBtn}').click();`);
    };

    const bindLink = (link) => {
        return browser.executeScript(`
            const $input = $('${SELECTOR.urlInput}');
            $input.val('${link}');
            $input.triggerHandler('input');
        `);
    };

    const bindLabel = (label) => {
        return browser.executeScript(`
            const $input = $('${SELECTOR.labelInput}');
            $input.val('${label}');
            $input.triggerHandler('input');
        `);
    };

    const readInput = () => {
        return browser.executeScript(`
            return {
                label: $('${SELECTOR.labelInput}').val(),
                link: $('${SELECTOR.urlInput}').val()
            };
        `);
    };

    const submit = () => {
        return browser.executeScript(`${SELECTOR.btnInsert}').click();`);
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
        openModal,
        bindLink,
        bindLabel,
        submit,
        isVisible,
        matchIframe,
        readInput
    };

};
