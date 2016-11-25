module.exports = () => {

    const SELECTOR = {
        button: '.composer-btn-attachment',
        dropzone: '.composer-dropzone',
        container: '.composer-askEmbedding',
        btnAttachment: '.composerAskEmbdded-btn-attachment',
        btnEmbedded: '.composerAskEmbdded-btn-inline',
        cancel: '.composerAskEmbdded-btn-cancel',
        list: {
            container: '.composerAttachments-container',
            item: '.composerAttachments-loader',
            remove: '.progressLoader-btn-remove',
            toggle: '.composerAttachments-action'
        }
    };

    const dropzone = () => {

        const isVisible = () => {
            return browser.executeScript(`
                return $(document.body.querySelector('.composer'))
                    .find('${SELECTOR.dropzone}')
                    .is(':visible');
            `);
        };

        const isVisibleAsk = () => {
            return browser.executeScript(`
                return $(document.body.querySelector('.composer'))
                    .find('${SELECTOR.container}')
                    .is(':visible');
            `);
        };

        const attachment = () => {
            return browser.executeScript(`
                return $(document.body.querySelector('.composer'))
                    .find('${SELECTOR.btnAttachment}')
                    .click();
            `);
        };

        const embedded = () => {
            return browser.executeScript(`
                return $(document.body.querySelector('.composer'))
                    .find('${SELECTOR.btnEmbedded}')
                    .click();
            `);
        };

        const cancel = () => {
            return browser.executeScript(`
                return $(document.body.querySelector('.composer'))
                    .find('${SELECTOR.cancel}')
                    .click();
            `);
        };

        const matchIframe = () => {
            return browser.executeScript(`
                return $(document.body.querySelector('.composer'))
                    .find('.angular-squire-wrapper')
                    .find('iframe')[0]
                    .contentDocument
                    .body
                    .querySelector(':not(.protonmail_signature_block-user)')
                    .querySelectorAll('img.proton-embedded')
                    .length;
            `);
        };

        return {
            isVisible, isVisibleAsk,
            attachment, embedded, cancel,
            matchIframe
        };

    };

    const attachmentsList = () => {

        const isVisible = () => {
            return browser.executeScript(`
                return $(document.body.querySelector('.composer'))
                    .find('${SELECTOR.list.container}')
                    .is(':visible');
            `);
        };

        const isOpened = () => {
            return browser.executeScript(`
                return !$(document.body.querySelector('.composer'))
                    .find('${SELECTOR.list.container}')
                    .hasClass('composerAttachments-close');
            `);
        };

        const isVisibleItems = () => {
            return browser.executeScript(`
                return $(document.body.querySelector('.composer'))
                    .find('${SELECTOR.list.container}')
                    .find('${SELECTOR.list.item}')
                    .is(':visible');
            `);
        };

        const countItems = () => {
            return browser.executeScript(`
                return $(document.body.querySelector('.composer'))
                    .find('${SELECTOR.list.container}')
                    .find('${SELECTOR.list.item}')
                    .length;
            `);
        };

        const remove = (i = 0) => {
            return browser.executeScript(`
                return $(document.body.querySelector('.composer'))
                    .find('${SELECTOR.list.container}')
                    .find('${SELECTOR.list.item}')
                    .find('${SELECTOR.list.remove}')
                    .eq(${i})
                    .click();
            `);
        };

        const toggle = () => {
            return browser.executeScript(`
                return $(document.body.querySelector('.composer'))
                    .find('${SELECTOR.list.container}')
                    .find('${SELECTOR.list.toggle}')
                    .click();
            `);
        };

        return {
            isVisible, isVisibleItems, isOpened,
            remove, toggle,
            countItems
        };
    };

    const isBtnActive = () => {
        return browser.executeScript(`
            return $(document.body.querySelector('.composer'))
                .find('${SELECTOR.button}')
                .hasClass('.primary');
        `);
    };

    return { dropzone, attachmentsList, isBtnActive };

};
