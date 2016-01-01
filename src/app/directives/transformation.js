angular.module("proton.transformation", [])

.directive('transformLinks', function($timeout) {
    return {
        restrict: 'A',
        link: function(scope, element, attributes) {
            var stopObserving = attributes.$observe('transformLinks', function(interpolatedValue) {
                $timeout(function() {
                    var links = angular.element(element).find('a[href^=http]');

                    if(links.length > 0) {
                        links.attr('target','_blank').attr('rel', 'noreferrer');
                        stopObserving();
                    }
                }, 0, false);
            });
        }
    };
})

.directive('hideFirstBlockquote', function($timeout, $translate) {
    return {
        restrict: 'A',
        link: function(scope, element, attributes) {
            var quotes = [
                '.protonmail_quote:first',
                '.gmail_quote:first',
                '.gmail_signature:first',
                '.yahoo_quoted:first',
                '#isForwardContent:first',
                '#isReplyContent:first',
                '#mailcontent:first',
                '#origbody:first',
                '#reply139content:first',
                '#oriMsgHtmlSeperator:first',
                'blockquote[type="cite"]:first'
            ];
            var stopObserving = attributes.$observe('hideFirstBlockquote', function(interpolatedValue) {
                $timeout(function() {
                    var blockquote;
                    var blockquotes = jQuery(element).find(quotes.join(', ')).first(); // Reduce the set of matched elements to the first in the set.

                    blockquote = _.first(blockquotes);

                    if(angular.isDefined(blockquote)) {
                        var button = angular.element('<button/>', {
                            title: $translate.instant('SHOW_PREVIOUS_MESSAGE'),
                            class: 'fa fa-ellipsis-h pm_button more',
                            click: function () {
                                if(angular.element(blockquote).is(':visible')) {
                                    angular.element(blockquote).hide();
                                } else {
                                    angular.element(blockquote).show();
                                }
                            }
                        });

                        // Add button to toggle the blockquote part
                        angular.element(blockquote).before(button);
                        // Hide blockquote part
                        angular.element(blockquote).hide();
                        // Stop searching of blockquotes
                        stopObserving();
                    }
                }, 0, false);
            });
        }
    };
});
