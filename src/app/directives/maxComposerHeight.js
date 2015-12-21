angular.module("proton.maxComposerHeight", [])

.directive('maxComposerHeight', function ($window, $timeout, $log) {
    return function (scope, element, attrs) {
        var setHeight = function() {
            var parent = element.closest('.composer');

            // Set to zero
            element.find('iframe').css({ height: 0 });

            var height =    parent.outerHeight();
                $log.debug(height);

                height -=   parent.find('header').outerHeight();
                $log.debug(height);

                height -=   parent.find('.meta').outerHeight();
                $log.debug(height);

                height -=   parent.find('.squire-toolbar').outerHeight();
                $log.debug(height);

                height -=   parent.find('footer').outerHeight();
                $log.debug(height);

                element.find('iframe').css({
                    height: height
                });
        };

        // Listen resize window
        angular.element($window).bind('resize', setHeight);

        // Listen state change
        scope.$on('$stateChangeSuccess', function() {
            setHeight();
        });

        // Listen composer mode change
        scope.$on('composerModeChange', function() {
            setHeight();
        });

        // Remove listener on resize window
        scope.$on('$destroy', function() {
            angular.element($window).unbind('resize', setHeight);
        });

        // Delay the first call
        $timeout(function() {
            setHeight();
        });

    };
});
