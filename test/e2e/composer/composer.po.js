const path = require('path');
const dropFile = require('../../e2e.utils/dropFile')();

module.exports = () => {

    const SELECTOR_MAP = {
        ToList: '.composer-field-ToList',
        CCList: '.composer-field-CCList',
        BCCList: '.composer-field-CCList',
        SubjectTitle: 'span.subject',
        From: '.composer-field-From',
        draft: '.composer-btn-save',
        close: '.composer-action-close',
        discard: '.composer-btn-discard',
        buttonCCBCC: '.composerInputMeta-overlay-button'
    };

    const MEDIA_DIRECTORY = path.resolve(__dirname, '../../');
    const FILES = [
        { file: 'media/baby-1.jpg', type: 'image/jpeg' },
        { file: 'media/baby-2.jpg', type: 'image/jpeg' },
        { file: 'media/test.txt', type: 'text/plain' }
    ].map(({ file, type }) => ({ file: path.join(MEDIA_DIRECTORY, file), type }));

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

    const upload = (quantity = 1) => {
        dropFile.dropMedia(FILES.slice(0, quantity), by.css('.composer'));
    };

    const config = {
        hasSignature: false
    };

    const checkSignature = () => {
        return browser.executeScript(`
            return !!$(document.body.querySelector('.composer'))
                .find('.angular-squire-wrapper')
                .find('iframe')[0]
                .contentDocument
                .body
                .querySelectorAll('img.proton-embedded')
                .length;
        `)
        .then((test) => (config.hasSignature = test));
    };
    const compose = () => {

        const removeEmbedded = (i = 0) => {
            return browser.executeScript(`

                const $img = $(document.body.querySelector('.composer'))
                    .find('.angular-squire-wrapper')
                    .find('iframe')[0]
                    .contentDocument
                    .body
                    .querySelectorAll('img.proton-embedded')[${i}];

                return $($img).remove();
            `);
        };

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

        const changeSignature = (index = 0) => {
            const click = () => {
                return browser.executeScript(`
                    const $form = $(document.body.querySelector('.composer'))
                        .find('${SELECTOR_MAP.From}');

                    const $select = $form.find('select');
                    $select.click();
                `);
            };

            const change = () => {
                return browser.executeScript(`
                    const $form = $(document.body.querySelector('.composer'))
                        .find('${SELECTOR_MAP.From}');

                    const $select = $form.find('select');
                    $select.find('option').get(${index});
                    $select.selected = true;
                    $select.get(0).selectedIndex = ${index};
                    $select.change();
                `);
            };

            return { click, change };
        };


        return {
            config, removeEmbedded, changeSignature,
            content, fillInput, send, isOpened, isVisible, openCCBCC,
            close, saveDraft, discardDraft, upload,
            addLinkModal: require('./tools/addLinkModal.po'),
            addFileModal: require('./tools/addFileModal.po'),
            autocomplete: require('./tools/autocomplete.po'),
            encryption: require('./tools/encryption.po'),
            expiration: require('./tools/expiration.po'),
            uploader: require('./tools/uploader.po'),

        };
    };

    const getSubject = () => {
        return browser.executeScript(`
            return $(document.body.querySelector('.composer'))
                .find('${SELECTOR_MAP.SubjectTitle}')
                .text();
        `);
    };

    return { open, isOpened, compose, checkSignature, config, close, getSubject };
};
