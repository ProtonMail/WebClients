module.exports = () => {

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

        return { content, fillInput, send, isOpened };
    };

    return { open, isOpened, compose };
};
