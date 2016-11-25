module.exports = () => {

    const SELECTOR = {
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

        return {
            isVisible, isVisibleAsk,
            attachment, embedded, cancel
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
                    .hasClass('.composerAttachments-close');
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

        const remove = () => {
            return browser.executeScript(`
                return $(document.body.querySelector('.composer'))
                    .find('${SELECTOR.list.container}')
                    .find('${SELECTOR.list.item}')
                    .find('${SELECTOR.list.remove}')
                    .click();
            `);
        };

        const toggle = () => {
            return browser.executeScript(`
                return $(document.body.querySelector('.composer'))
                    .find('${SELECTOR.list.container}')
                    .find('${SELECTOR.list.item}')
                    .find('${SELECTOR.list.toggle}')
                    .click();
            `);
        };

        return {
            isVisible, isVisibleItems, isOpened,
            remove, toggle
        };
    };

    return { dropzone, attachmentsList };

};
