angular.module('proton.elements')
    .directive('ptSelectElements', ($rootScope) => ({
        link(scope, el) {

            function onChange({ target }) {
                const isChecked = target.checked;
                $rootScope.$emit('selectElements', { value: target.value, isChecked });
                // No keyX event if a checkbox is focused
                _rAF(() => target.blur());
            }

            el.on('change', onChange);

            scope.$watch('value', () => el.change());

            scope
            .$on('$destroy', () => {
                el.off('change', onChange);
            });
        }

    }));
