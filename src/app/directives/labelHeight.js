angular.module("proton.labelHeight", [])

.directive('ngLabelHeight', ['$window', function ($window) {
    return function (scope, element, attrs) {
        var setHeight = function() {
            var sidebarHeight = angular.element($window).height();
            var height = (sidebarHeight - 550);

            element.css({
                height: height + 'px'
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
