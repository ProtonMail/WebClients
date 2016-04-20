angular.module("proton.transformation", [])

.directive('transformLinks', function($timeout) {
    return {
        restrict: 'A',
        link: function(scope, element, attributes) {
            scope.$watch(attributes.ngBindHtml, function(newValue, oldValue) {
                $timeout(function() {
                    var links = angular.element(element).find('a[href^=http]');

                    if(links.length > 0) {
                        links.attr('target','_blank').attr('rel', 'noreferrer');
                    }
                }, 0, false);
            });
        }
    };
})

.directive('hideFirstBlockquote', function($timeout, gettextCatalog) {
    return {
        restrict: 'A',
        link: function(scope, element, attributes) {
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
            ].join(', ');
            var stopObserving = scope.$watch(attributes.ngBindHtml, function(newValue, oldValue) {
                $timeout(function() {
                    var blockquote = jQuery(element).find(quotes).first(); // Reduce the set of matched elements to the first in the set.
                    var parent = angular.element(blockquote).parent().clone(); // Clone the parent of the current blockquote
                    var textSplitted = parent.text().replace(/\s+/g, '').split(blockquote.text().replace(/\s+/g, ''));

                    if (angular.isArray(textSplitted) && textSplitted.length > 0 && textSplitted[0].length > 0) {
                        var button = angular.element('<button/>', {
                            title: gettextCatalog.getString('Show previous message', null, 'Title'),
                            class: 'fa fa-ellipsis-h pm_button more',
                            click: function () {
                                if(angular.element(blockquote).is(':visible')) {
                                    angular.element(blockquote).hide();
                                } else {
                                    angular.element(blockquote).show();

                                    if (attributes.scroll === true) {
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
