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

.directive('hideFirstBlockquote', function($timeout) {
    return {
        restrict: 'A',
        link: function(scope, element, attributes) {
            var stopObserving = attributes.$observe('hideFirstBlockquote', function(interpolatedValue) {
                $timeout(function() {
                    var blockquote = angular.element(element).find('blockquote:first');

                    if(blockquote.length > 0) {
                        var button = angular.element('<button/>', {
                            class: 'fa fa-ellipsis-h pm_button more',
                            click: function () {
                                blockquote.show();
                                button.remove();
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
