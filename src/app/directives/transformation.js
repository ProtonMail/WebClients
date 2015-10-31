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
            var done = false;

            attributes.$observe('hideFirstBlockquote', function(interpolatedValue) {
                if(done === false) {
                    $timeout(function() {
                        var blockquote = angular.element(element).find('blockquote:first');
                        var button = angular.element('<button/>', {
                            text: '...',
                            click: function () {
                                blockquote.show();
                                button.remove();
                            }
                        });

                        blockquote.before(button);
                        blockquote.hide();
                    }, 0, false);
                }
            });
        }
    };
});
