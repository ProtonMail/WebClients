angular.module('proton.message')
.factory('transformBlockquotes', (gettextCatalog) => {
    const quotes = [
        '.protonmail_quote',
        '.gmail_quote',
        '.yahoo_quoted',
        // '.WordSection1',
        '#isForwardContent',
        '#isReplyContent',
        '#mailcontent',
        '#origbody',
        '#reply139content',
        '#oriMsgHtmlSeperator',
        '#OLK_SRC_BODY_SECTION',
        'blockquote:last-child'
    ].join(',');

    return (html, message) => {
        const blockquote = html.querySelector(quotes);

        if (blockquote) {
            if (blockquote.textContent.trim().length < html.textContent.trim().length) {
                const button = document.createElement('button');
                const title = gettextCatalog.getString('Show previous message', null, 'Title');

                button.className = 'fa fa-ellipsis-h pm_button more proton-message-blockquote-toggle';
                button.setAttribute('title', title);
                blockquote.parentNode.insertBefore(button, blockquote);
            }
        }

        return html;
    };
});
