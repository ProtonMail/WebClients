angular.module('proton.responsiveComposer', [])
.directive('responsiveComposer', ($rootScope, authentication) => {

    /**
     * Factory to compute sizes
     * @param  {$scope} scope
     * @return {Function}        Callback
     */
    const computeType = (scope) => () => {

        // If the composer is maximized do nothing, keep this state
        if (scope.message.maximized) {
            return;
        }

        const width = window.innerWidth;
        const height = window.innerHeight;
        const isSmall = (width <= 640 || height <= 500);

        // max
        scope
            .$applyAsync(() => {
                $rootScope.small = height < 700 && height >= 600;
                $rootScope.mini = height < 600;

                isSmall && scope.maximize(scope.message);
                !isSmall && (authentication.user.ComposerMode === 0) && scope.normalize(scope.message);
            });
    };

    return {
        restrict: 'A',
        link(scope) {

            const resizable = computeType(scope);
            const onResize = _.debounce(resizable, 100);

            const id = setTimeout(() => {
                resizable();
                clearTimeout(id);
            }, 100);

            window.addEventListener('resize', onResize);

            // Remove listener on resize window
            scope.$on('$destroy', () => {
                window.removeEventListener('resize', onResize);
            });
        }
    };
});
