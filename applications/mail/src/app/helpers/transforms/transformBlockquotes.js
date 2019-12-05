import { c } from 'ttag';

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

const quotes = BLOCKQUOTE_SELECTORS.map((selector) => `${selector}:not(:empty)`).join(',');

export const transformBlockquotes = ({ document: doc }) => {
    const blockquotes = [...doc.querySelectorAll(quotes)];
    const parent = doc.textContent;
    let found = false;

    blockquotes.forEach((blockquote) => {
        if (!found) {
            const child = blockquote.textContent;
            const [before = '', after = ''] = parent.split(child);

            if (child.length < parent.length && before.length && !after.length) {
                const button = document.createElement('button');
                const title = c('Title').t`Show previous message`;

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

    return { document: doc };
};
