angular.module("proton.labelHeight", [])

.directive('ngLabelHeight', ['$window', function ($window) {
    return function (scope, element, attrs) {
        var setHeight = function() {

            // set to zero
            element.css({ height: 0 });
            
            var sidebarHeight = angular.element($window).height();
            var height = (sidebarHeight - 560);

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
