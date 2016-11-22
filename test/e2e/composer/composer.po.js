module.exports = () => {

    const SELECTOR_MAP = {
        CCList: '.composer-field-CCList',
        BCCList: '.composer-field-CCList',
        buttonCCBCC: '.composerInputMeta-overlay-button',
        toolbarBtnImage: '.squireToolbar-action-image',
        popoverFileInput: 'input[type="url"]',
        formAddFilePopover: '.addFilePopover-container',
        btnAddFilePopover: '.addFilePopover-btn-url'
    };

    const open = () => {
        return element(by.css('.compose.pm_button')).click();
    };

    const isOpened = () => browser
        .executeScript(() => {
            return document.body.querySelector('.composer') !== null;
        });

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

        const addFilePopover = () => {
            return {
                openForm() {
                    return browser.executeScript(`$('${SELECTOR_MAP.toolbarBtnImage}').click();`);
                },
                bindLink(link) {
                    return browser.executeScript(`
                        const $input = $('${SELECTOR_MAP.formAddFilePopover}').find('${SELECTOR_MAP.popoverFileInput}');
                        $input.val('${link}');
                        $input.triggerHandler('input');
                    `);
                },
                submit() {
                    return browser.executeScript(`$('${SELECTOR_MAP.formAddFilePopover}').find('${SELECTOR_MAP.btnAddFilePopover}').click();`)
                },
                matchIframe(value) {
                    return browser.executeScript(`
                        const img = $(document.body.querySelector('.composer'))
                            .find('.angular-squire-wrapper')
                            .find('iframe')[0]
                            .contentDocument
                            .body
                            .querySelector('img[src="${value}"]');
                        return img;
                    `);
                }
            }
        };

        return { content, fillInput, send, isOpened, isVisible, openCCBCC, addFilePopover };
    };

    return { open, isOpened, compose };
};
