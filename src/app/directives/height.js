angular.module("proton.height", [])
    .directive('ptHeight', ['$window', function ($window) {
        return function (scope, element, attrs) {

            function setHeight () {
                // set to zero
                element.css({ height: '1px' });
                var windowHeight = $window.innerHeight;
                var elementOffset = element[0].getBoundingClientRect();
                var height = windowHeight - elementOffset.top;
                element.css({height: height + 'px'});
            }

            var onResize = _.debounce(setHeight);

            // Listen resize window
            $window.addEventListener('resize', onResize);

            scope.$on('$stateChangeSuccess', setHeight);

            setTimeout(setHeight);
            // Remove listener on resize window
            scope
                .$on('$destroy', function() {
                    $window.removeEventListener('resize', onResize);
                });
        };
    }]);
