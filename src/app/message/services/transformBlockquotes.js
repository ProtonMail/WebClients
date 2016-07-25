angular.module('proton.message')
.factory('transformBlockquotes', function(gettextCatalog) {
    return function(html) {
        var quotes = [
            '.protonmail_quote:first',
            '.gmail_quote:first',
            '.yahoo_quoted:first',
            '.WordSection1:first',
            '#isForwardContent:first',
            '#isReplyContent:first',
            '#mailcontent:first',
            '#origbody:first',
            '#reply139content:first',
            '#oriMsgHtmlSeperator:first',
            '#OLK_SRC_BODY_SECTION:first',
            'blockquote[type="cite"]:first'
        ].join(',');

        var blockquote = html.querySelectorAll(quotes)[0]; // Reduce the set of matched elements to the first in the set.
        var parent = blockquote.parentElement;
        var clone = angular.element(parent).clone(); // Clone the parent of the current blockquote
        var textSplitted = clone.textContent.replace(/\s+/g, '').split(blockquote.textContent.replace(/\s+/g, ''));

        if (angular.isArray(textSplitted) && textSplitted.length > 0 && textSplitted[0].length > 0) {
            var button = document.createElement('button');
            var title = gettextCatalog.getString('Show previous message', null, 'Title');

            button.className = 'fa fa-ellipsis-h pm_button more';
            button.setAttribute('title', title);
            blockquote.before(button);
            blockquote.style.display = 'none';
        }

        return html;
    };
});
