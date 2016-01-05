angular.module("proton.responsiveComposer", [])

.directive('responsiveComposer', function ($window) {
    return {
        restrict: 'A',
        link: function (scope, element, attrs, message) {
            var responsive = function() {
                
                // small
                if ($window.innerHeight < 700) {
                    scope.message.small = true;
                }
                else {
                    scope.message.small = false;
                }

                // mini
                if ($window.innerHeight < 600) {
                    scope.message.mini = true;
                }
                else {
                    scope.message.mini = false;
                }

                // max
                if ( ($window.innerWidth <= 1024) || ($window.innerHeight <= 500) ) {
                    scope.maximize(scope.message);
                }
                else {

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
