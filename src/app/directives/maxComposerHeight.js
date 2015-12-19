angular.module("proton.maxComposerHeight", [])

.directive('ngMaxComposerHeight', ['$window', '$log', function ($window, $log) {
    return function (scope, element, attrs) {

        var setHeight = function() {

            var parent = element.closest('.composer');

            // set to zero
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

        scope.$on('$stateChangeSuccess', function() {
            setHeight();
        });

        scope.$on('composerModeChange', function() { // TODO PANDA RICHARD HELP!!!!
            setHeight();
        });

        $rootScope.$broadcast('editorLoaded', element, editor);

        // Remove listener on resize window
        scope.$on('$destroy', function() {
            angular.element($window).unbind('resize', setHeight);
        });

        setTimeout(function() {
            setHeight();
        });

    };
}]);
