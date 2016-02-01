angular.module("proton.height", [])

.directive('ptHeight', ['$window', function ($window) {
    return function (scope, element, attrs) {
        var setHeight = function() {

            // set to zero
            element.css({ height: '1px' });

            var margin = 0;
            var windowHeight = angular.element($window).height();
            var elementOffset = element[0].getBoundingClientRect();
            var height = windowHeight - elementOffset.top - margin;

            // console.log('windowHeight: '+windowHeight);
            // console.log('elementOffset.top: '+elementOffset.top);
            // console.log('height: '+height);

            element.css({
                height: height + 'px'
            });
        };

        // Listen resize window
        angular.element($window).bind('resize', $window._.debounce(setHeight));

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
