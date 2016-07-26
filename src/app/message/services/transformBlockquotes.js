angular.module('proton.message')
.factory('transformBlockquotes', function(gettextCatalog) {
    return function(html, message) {
        var quotes = [
            '.protonmail_quote',
            '.gmail_quote',
            '.yahoo_quoted',
            '.WordSection1',
            '#isForwardContent',
            '#isReplyContent',
            '#mailcontent',
            '#origbody',
            '#reply139content',
            '#oriMsgHtmlSeperator',
            '#OLK_SRC_BODY_SECTION',
            'blockquote[type="cite"]'
        ].join(',');

        var blockquotes = html.querySelectorAll(quotes);
        var blockquote = blockquotes[0];

        if (blockquote) {
            var button = document.createElement('button');
            var title = gettextCatalog.getString('Show previous message', null, 'Title');

            button.className = 'fa fa-ellipsis-h pm_button more';
            button.setAttribute('title', title);
            blockquote.parentNode.insertBefore(button, blockquote);
            blockquote.style.display = 'none';
        }

        return html;
    };
});
