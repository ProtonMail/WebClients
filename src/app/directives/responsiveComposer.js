angular.module("proton.responsiveComposer", [])

.directive('responsiveComposer', ['$window', function ($window) {
    return {
        restrict: 'A',
        scope: {
            message: '='
        },
        link: function (scope, element, attrs, message) {

            console.log(message);

            var responsive = function() {

                if ($window.innerWidth <= 1024) {
                    scope.maximize(message);
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
}]);
