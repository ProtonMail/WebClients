angular.module('proton.height', [])
    .directive('ptHeight', ['$window', function ($window) {
        return function (scope, element) {

            function setHeight() {
                // set to zero
                element.css({ height: '1px' });
                const windowHeight = $window.innerHeight;
                const elementOffset = element[0].getBoundingClientRect();
                const height = windowHeight - elementOffset.top;
                element.css({ height: height + 'px' });
            }

            const onResize = _.debounce(setHeight);

            // Listen resize window
            $window.addEventListener('resize', onResize);

            scope.$on('$stateChangeSuccess', setHeight);

            setTimeout(setHeight);
            // Remove listener on resize window
            scope
                .$on('$destroy', () => {
                    $window.removeEventListener('resize', onResize);
                });
        };
    }]);
