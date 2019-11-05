const BLOCKQUOTE_SELECTORS = [
    '.protonmail_quote',
    '.gmail_quote',
    '.yahoo_quoted',
    '.gmail_extra',
    '.moz-cite-prefix',
    // '.WordSection1',
    '#isForwardContent',
    '#isReplyContent',
    '#mailcontent:not(table)',
    '#origbody',
    '#reply139content',
    '#oriMsgHtmlSeperator',
    'blockquote[type="cite"]'
];

/* @ngInject */
function transformBlockquotes(gettextCatalog) {
    const quotes = BLOCKQUOTE_SELECTORS.map((selector) => `${selector}:not(:empty)`).join(',');

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

                    button.className = 'pm-button pm-button--small more proton-message-blockquote-toggle';
                    button.textContent = '...'; // perf issue we can't use <icon> as we don't want to compile.
                    button.setAttribute('title', title);

                    // For some messages, the content of the message before <button> is not inside <div>
                    blockquote.parentNode.insertBefore(document.createElement('BR'), blockquote);
                    blockquote.parentNode.insertBefore(button, blockquote);

                    found = true;
                }
            }
        });

        return html;
    };
}
export default transformBlockquotes;
