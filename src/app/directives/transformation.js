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
                    var blockquote = angular.element(element).find('blockquote.protonmail_quote:first');

                    if(blockquote.length > 0) {
                        var button = angular.element('<button/>', {
                            title: $translate.instant('SHOW_PREVIOUS'),
                            class: 'fa fa-ellipsis-h pm_button more',
                            click: function () {
                                if($(blockquote).is(':visible')) {
                                    blockquote.hide();
                                } else {
                                    blockquote.show();
                                }
                            }
                        });

                        blockquote.before(button);
                        blockquote.hide();
                        stopObserving();
                    }
                }, 0, false);
            });
        }
    };
});
