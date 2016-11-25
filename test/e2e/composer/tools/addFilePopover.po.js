module.exports = () => {

    const SELECTOR = {
        toolbarBtn: '.squireToolbar-action-image',
        popoverInput: 'input[type="url"]',
        formAddPopover: '.addFilePopover-container',
        btnAddPopover: '.addFilePopover-btn-url',
        btnAddEmbedded: '.addFilePopover-btn-embedded '
    };

    const isVisible = () => {
        return browser.executeScript(`
            return $('${SELECTOR.formAddPopover}').is(':visible')
        `);
    };

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

    const upload = () => {
        const file = '/home/dhoko/Téléchargements/debug/ZpXFzpO.jpg';

        element(by.css('.composer .addFilePopover-input-file')).sendKeys(file);
        return browser.executeScript(`$('${SELECTOR.formAddPopover}').find('${SELECTOR.btnAddEmbedded}').click();`)
    };

    const matchIframe = (value) => {
        return browser.executeScript(`
            const img = $(document.body.querySelector('.composer'))
                .find('.angular-squire-wrapper')
                .find('iframe')[0]
                .contentDocument
                .body
                .querySelector('img[src="${value}"]');
            return (img && img.src === '${value}');
        `);
    };


    return {
        openForm,
        bindLink,
        submit,
        upload,
        isVisible,
        matchIframe
    };

};
