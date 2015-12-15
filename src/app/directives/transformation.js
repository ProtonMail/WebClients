angular.module("proton.transformation", [])

.directive('transformLinks', function($timeout) {
    return {
        restrict: 'A',
        link: function(scope, element, attributes) {
            attributes.$observe('transformLinks', function(interpolatedValue) {
                $timeout(function() {
                    angular.element(element).find('a[href^=http]').attr('target','_blank').attr('rel', 'noreferrer');
                }, 0, false);
            });
        }
    };
})

.directive('hideFirstBlockquote', function($timeout, $translate) {
    return {
        restrict: 'A',
        link: function(scope, element, attributes) {
            var stopObserving = attributes.$observe('hideFirstBlockquote', function(interpolatedValue) {
                $timeout(function() {
                    var blockquote;
                    var blockquotes = angular.element(element).find('.protonmail_quote, div.gmail_extra, div.gmail_quote, .yahoo_quoted, #isForwardContent, #isReplyContent, #mailcontent, #origbody, #reply139content, #oriMsgHtmlSeperator, blockquote[type="cite"]');

                    if(blockquotes.length === 0) {
                        // TODO detect specific strings
                    }

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

                        angular.element(blockquote).before(button);
                        angular.element(blockquote).hide();
                        stopObserving();
                    }
                }, 0, false);
            });
        }
    };
});
