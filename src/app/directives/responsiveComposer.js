angular.module("proton.responsiveComposer", [])

.directive('responsiveComposer', function ($window) {
    return {
        restrict: 'A',
        link: function (scope, element, attrs, message) {
            var responsive = function() {
                if ( ($window.innerWidth <= 1024) || ($window.innerHeight <= 700) ) {
                    scope.maximize(scope.message);
                }
            };

            // Listen resize window
            angular.element($window).bind('resize', responsive);

            scope.$on('$stateChangeSuccess', function() {
                responsive();
            });

            // Remove listener on resize window
            scope.$on('$destroy', function() {
                angular.element($window).unbind('resize', responsive);
            });

            setTimeout(function() {
                responsive();
            });
        }
    };
});
