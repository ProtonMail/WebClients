/* @ngInject */
const ptSelectElements = (dispatchers) => ({
    link(scope, el) {
        const { dispatcher } = dispatchers(['selectElements']);
        function onChange({ target }) {
            const isChecked = target.checked;
            const action = target.value;
            dispatcher.selectElements(action, { isChecked });
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
