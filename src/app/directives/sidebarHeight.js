angular.module("proton.sidebarHeight", [])

.directive('ngSidebarHeight', ['$window', function ($window) {
    return function (scope, element, attrs) {
        var setHeight = function() {

            // set to zero
            element.css({ height: 0 });
            
            var windowHeight = angular.element($window).height();
            var headerHeight = $('#pm_header').outerHeight();
            var height = (windowHeight - headerHeight);

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
