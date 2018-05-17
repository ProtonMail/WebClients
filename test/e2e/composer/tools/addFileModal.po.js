module.exports = () => {

    const SELECTOR = {
        toolbarBtn: '.squireToolbar-action-image',
        urlInput: '.addFile-addressInput"',
        container: '.addFile-container',
        btnInsert: '.addFile-insert-button',
        btnFile: '.addFile-file-button ',
        fileInput: '.addFile-fileInput'
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

    const submit = () => {
        return browser.executeScript(`$('${SELECTOR.btnInsert}').click();`);
    };

    const upload = () => {
        const file = '/home/dhoko/Téléchargements/debug/ZpXFzpO.jpg';

        element(by.css(SELECTOR.fileInput))
            .sendKeys(file);
        return browser.executeScript(`$('${SELECTOR.btnFile}').click();`);
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
        openModal,
        bindLink,
        submit,
        upload,
        isVisible,
        matchIframe
    };

};
