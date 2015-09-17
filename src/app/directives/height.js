angular.module("proton.height", [])

.directive('ngHeight', ['$window', function ($window) {
    return function (scope, element, attrs) {

        function setHeight() {

            var windowHeight = angular.element($window).height();
            var elementOffset = element[0].getBoundingClientRect();
            var height = (windowHeight - elementOffset.top - 20);

            element.css({
                height: height
            });

        }

        scope.$on('resized', function() {
            $log.debug('resized');
            setHeight();
        });

        var init = setInterval( setHeight, 120);
        setTimeout( function() {
            clearInterval(init);
            $log.info('end');
        }, 2400);

    };
}]);
