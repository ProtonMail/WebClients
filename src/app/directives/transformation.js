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
                    var style = 'background-color: #f1f1f1;border: 1px solid #ddd;color: #666;clear: both;line-height: 6px;outline: none;'; // TODO add style (for Jason)

                    if(blockquote.length > 0) {
                        var button = angular.element('<button/>', {
                            class: 'fa fa-ellipsis-h',
                            style: style,
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
