angular.module('proton.elements')
    .directive('ptSelectElements', ($rootScope) => ({
        scope: {
            value: '='
        },
        link(scope, el) {

            function onChange({ target }) {
                const isChecked = target.checked;
                scope
                    .$applyAsync(() => {
                        $rootScope.$broadcast('selectElements', { value: scope.value, isChecked });
                    });

                // No keyX event if a checkbox is focused
                _rAF(() => target.blur());
            }

            el.on('change', onChange);

            scope.$watch('value', () => { el.change(); });

            scope
            .$on('$destroy', () => {
                el.off('change', onChange);
            });
        }

    }));
