angular.module('proton.labelHeight', [])

.directive('ngLabelHeight', ($window) => {
    return function (scope, element) {
        const setHeight = function () {

            // set to zero
            element.css({ height: 0 });

            const sidebarHeight = angular.element($window).height();
            const height = (sidebarHeight - 560);

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
});
