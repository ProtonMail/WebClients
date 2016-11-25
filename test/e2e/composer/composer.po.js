const path = require('path');
const dropFile = require('../../e2e.utils/dropFile');

module.exports = () => {

    const SELECTOR_MAP = {
        ToList: '.composer-field-ToList',
        CCList: '.composer-field-CCList',
        BCCList: '.composer-field-CCList',
        draft: '.composer-btn-save',
        close: '.composer-action-close',
        discard: '.composer-btn-discard',
        buttonCCBCC: '.composerInputMeta-overlay-button'
    };

    const open = () => {
        return element(by.css('.compose.pm_button')).click();
    };

    const close = () => {
        return browser.executeScript(`
            $('${SELECTOR_MAP.close}').click();
        `);
    };
    const saveDraft = () => {
        return browser.executeScript(`
            $('${SELECTOR_MAP.draft}').click();
        `);
    };

    const discardDraft = () => {
        return browser.executeScript(`
            $('${SELECTOR_MAP.discard}').click();
        `);
    };

    const isOpened = () => browser
        .executeScript(() => {
            return document.body.querySelector('.composer') !== null;
        });

    const upload = () => {
        const file = '/home/dhoko/Téléchargements/debug/ZpXFzpO.jpg';
        // const file = '/home/dhoko/Téléchargements/debug/anne-frank.epub';
        // element(by.css('.composer input[type="file"]')).sendKeys(file);
        // element(by.css('.composer .addFilePopover-container')).submit();
        //
        //
        dropFile.dropMedia([file], by.css('.composer'), 'image/jpeg');
    };

    const compose = () => {

        const content = (txt) => {

            // Can't use txt inside of a callback YOFLO
            const body = `
                const $div = $(document.body.querySelector('.composer'))
                    .find('.angular-squire-wrapper')
                    .find('iframe')[0]
                    .contentDocument
                    .body
                    .querySelector('div');

                    $div.textContent = '${txt}';
                    return $div.textContent;
            `;
            return browser.executeScript(body);
        };

        const fillInput = (type, value) => {
            const isSubject = 'Subject' === type;
            const input = isSubject ? 'input' : 'input.autocompleteEmails-input';

            let body = `
                const $input = $('.composer-field-${type}')
                    .find('${input}');

                $input.val('${value}');
            `;

            if (type === 'Subject') {
                body += `$input.triggerHandler('input');`;
                body += '$input.blur();';
            } else {
                body += `$input.parents('form.composerInputMeta-autocomplete').submit();`
            }

            body += 'return $input.val()';
            return browser.executeScript(body);
        };

        const isOpened = () => browser.executeScript(`return document.body.querySelector('.composer') !== null`);

        const send = () => browser.executeScript(`$('.btnSendMessage-btn-action').click()`);


        const openCCBCC = () => browser.executeScript(`$('${SELECTOR_MAP.buttonCCBCC}').eq(0).click();`);

        const isVisible = (key) => {
            const selector = SELECTOR_MAP[key];
            return browser.executeScript(`return $('${selector}').is(':visible')`);
        };

        return {
            content, fillInput, send, isOpened, isVisible, openCCBCC,
            close, saveDraft, discardDraft, upload,
            addLinkPopover: require('./tools/addLinkPopover.po'),
            addFilePopover: require('./tools/addFilePopover.po'),
            autocomplete: require('./tools/autocomplete.po'),
            encryption: require('./tools/encryption.po'),
            expiration: require('./tools/expiration.po'),
            uploader: require('./tools/uploader.po'),

        };
    };

    return { open, isOpened, compose };
};
