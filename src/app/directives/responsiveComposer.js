angular.module("proton.responsiveComposer", [])

.directive('responsiveComposer', function ($window, $rootScope, $timeout, authentication) {
    return {
        restrict: 'A',
        link: function (scope, element, attrs, message) {
            var responsiveTimeout;
            var responsive = function() {
                // small
                if ($window.innerHeight < 700) {
                    $rootScope.small = true;
                } else {
                    $rootScope.small = false;
                }

                // mini
                if ($window.innerHeight < 600) {
                    $rootScope.mini = true;
                } else {
                    $rootScope.mini = false;
                }

                // max
                if ( ($window.innerWidth <= 640) || ($window.innerHeight <= 500) ) {
                    scope.maximize(scope.message);
                } else {
                    if (authentication.user.ComposerMode === 0) {
                        scope.normalize(scope.message);
                    }
                }
            };

            // Listen resize window
            angular.element($window).bind('resize', responsive);

            // Remove listener on resize window
            scope.$on('$destroy', function() {
                angular.element($window).unbind('resize', responsive);
                $timeout.cancel(responsiveTimeout);
            });

            responsiveTimeout = $timeout(function() {
                responsive();
            });
        }
    };
});
