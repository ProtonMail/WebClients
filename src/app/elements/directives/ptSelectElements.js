/* @ngInject */
const ptSelectElements = ($rootScope) => ({
    link(scope, el) {
        function onChange({ target }) {
            const isChecked = target.checked;
            const action = target.value;
            $rootScope.$emit('selectElements', { type: action, data: { isChecked } });
            // No keyX event if a checkbox is focused
            _rAF(() => target.blur());
        }

        el.on('change', onChange);

        scope.$watch('value', () => el.change());

        scope.$on('$destroy', () => {
            el.off('change', onChange);
        });
    }
});
export default ptSelectElements;
