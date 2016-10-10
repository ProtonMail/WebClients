angular.module('proton.rightClick', [])
.directive('ngRightClick', ($parse) => {
    return {
        restrict: 'A',
        link(scope, element, attrs) {
            const fn = $parse(attrs.ngRightClick);

            element.bind('contextmenu', (event) => {
                scope.$apply(() => {
                    event.preventDefault();
                    fn(scope, { $event: event });
                });
            });
        }
    };
});
