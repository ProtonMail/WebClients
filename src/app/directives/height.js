angular.module("proton.height", [])

.directive('ptHeight', ['$window', function ($window) {
    return function (scope, element, attrs) {
        var setHeight = function() {
            var margin = 20;
            var windowHeight = angular.element($window).height();
            var elementOffset = element[0].getBoundingClientRect();
            var height = windowHeight - elementOffset.top - margin;

            element.css({
                height: height + 'px'
            });
        };

        // Listen resize window
        angular.element($window).bind('resize', setHeight);

        // Remove listener on resize window
        scope.$on('$destroy', function() {
            angular.element($window).unbind('resize', setHeight);
        });

        setHeight();
    };
}]);
