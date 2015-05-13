angular.module('proton.ondrag', [])
    .directive('ondragenter', function() {
        return {
            restrict: 'A',
            scope: {
                ondragenter: '&ondragenter'
            },
            link: function(scope, element, attrs) {
                element[0].addEventListener('dragenter', function(event) {
                    scope.ondragenter();
                    return false;
                }, false);
            }
        };
    });
