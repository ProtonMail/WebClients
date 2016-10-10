angular.module('proton.heightOutside', [])

.directive('ngHeightOutside', ['$window', function ($window) {
    return function (scope, element) {
        const setHeight = function () {

            // set to zero
            element.css({ height: 0 });

            const windowHeight = angular.element($window).height();
            const elementOffset = element[0].getBoundingClientRect();
            const height = (windowHeight - elementOffset.top - 200);

            element.css({
                height
            });
        };

        // Listen resize window
        angular.element($window).bind('resize', setHeight);

        scope.$on('$stateChangeSuccess', () => {
            setHeight();
        });

        // Remove listener on resize window
        scope.$on('$destroy', () => {
            angular.element($window).unbind('resize', setHeight);
        });

        setTimeout(() => {
            setHeight();
        });
    };
}]);
