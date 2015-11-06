angular.module("proton.heightOutside", [])

.directive('ngHeightOutside', ['$window', function ($window) {
    return function (scope, element, attrs) {
        var setHeight = function() {

            // set to zero
            element.css({ height: 0 });
            
            var windowHeight = angular.element($window).height();
            var elementOffset = element[0].getBoundingClientRect();
            var height = (windowHeight - elementOffset.top - 200);

            element.css({
                height: height
            });
        };

        // Listen resize window
        angular.element($window).bind('resize', setHeight);

        scope.$on('$stateChangeSuccess', function() {
            setHeight();
        });

        // Remove listener on resize window
        scope.$on('$destroy', function() {
            angular.element($window).unbind('resize', setHeight);
        });

        setTimeout(function() {
            setHeight();
        });
    };
}]);
