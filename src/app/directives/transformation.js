angular.module("proton.transformation", [])

.directive('transformLinks', function($timeout) {
    return {
        restrict: 'A',
        link: function(scope, element, attributes) {
            var stopObserving = attributes.$observe('ngBindHtml', function(interpolatedValue) {
                $timeout(function() {
                    var links = angular.element(element).find('a[href^=http]');

                    if(links.length > 0) {
                        links.attr('target','_blank').attr('rel', 'noreferrer');
                    }

                    stopObserving();
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
                '.yahoo_quoted:first',
                '#isForwardContent:first',
                '#isReplyContent:first',
                '#mailcontent:first',
                '#origbody:first',
                '#reply139content:first',
                '#oriMsgHtmlSeperator:first',
                'blockquote:first'
            ];
            var stopObserving = attributes.$observe('ngBindHtml', function(interpolatedValue) {
                $timeout(function() {
                    var blockquote = jQuery(element).find(quotes.join(', ')).first(); // Reduce the set of matched elements to the first in the set.

                    if(angular.isDefined(blockquote)) {
                        var button = angular.element('<button/>', {
                            title: $translate.instant('SHOW_PREVIOUS_MESSAGE'),
                            class: 'fa fa-ellipsis-h pm_button more',
                            click: function () {
                                if(angular.element(blockquote).is(':visible')) {
                                    angular.element(blockquote).hide();
                                } else {
                                    angular.element(blockquote).show();

                                    $timeout(function() {
                                        var element = angular.element(blockquote);

                                        if(angular.isElement(element) && angular.isDefined(element.offset())) {
                                            var headerOffset = $('#conversationHeader').offset().top + $('#conversationHeader').height();
                                            var amountScrolled = $('#pm_thread').scrollTop();
                                            var value = element.offset().top + amountScrolled - headerOffset;

                                            $('#pm_thread').animate({
                                                scrollTop: (value - 40)
                                            }, 200, function() {
                                                $(this).animate({
                                                    opacity: 1
                                                }, 200);
                                            });
                                        }
                                    }, 100);
                                }
                            }
                        });

                        // Add button to toggle the blockquote part
                        angular.element(blockquote).before(button);
                        // Hide blockquote part
                        angular.element(blockquote).hide();
                        // Stop searching of blockquote
                        stopObserving();
                    }
                }, 0, false);
            });
        }
    };
});
