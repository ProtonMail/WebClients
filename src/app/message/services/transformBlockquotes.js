/* @ngInject */
function transformBlockquotes(gettextCatalog) {
    const quotes = [
        '.protonmail_quote',
        '.gmail_quote',
        '.yahoo_quoted',
        // '.WordSection1',
        '#isForwardContent',
        '#isReplyContent',
        '#mailcontent:not(table)',
        '#origbody',
        '#reply139content',
        '#oriMsgHtmlSeperator',
        'blockquote[type="cite"]'
    ]
        .map((selector) => `${selector}:not(:empty)`)
        .join(',');

    return (html) => {
        const blockquotes = [].slice.call(html.querySelectorAll(quotes));
        const parent = html.textContent;
        let found = false;

        blockquotes.forEach((blockquote) => {
            if (!found) {
                const child = blockquote.textContent;
                const [before = '', after = ''] = parent.split(child);

                if (child.length < parent.length && before.length && !after.length) {
                    const button = document.createElement('button');
                    const title = gettextCatalog.getString('Show previous message', null, 'Title');

                    button.className = 'fa fa-ellipsis-h pm_button more proton-message-blockquote-toggle';
                    button.setAttribute('title', title);
                    blockquote.parentNode.insertBefore(button, blockquote);

                    found = true;
                }
            }
        });

        return html;
    };
}
export default transformBlockquotes;
