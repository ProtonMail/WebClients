/* @ngInject */
const customCheckbox = (customInputCreator, dispatchers) => ({
    replace: true,
    templateUrl: require('../../../templates/ui/customCheckbox.tpl.html'),
    compile: customInputCreator('checkbox', {
        post(scope, el, { customCheckboxEvent }) {
            if (customCheckboxEvent) {
                const { dispatcher } = dispatchers(['customCheckbox']);
                const $input = el.find('input');

                // On change event is buggy with Angular, seems it leaks, click is more reliable
                const onChange = (event) => {
                    dispatcher.customCheckbox('change', { event });
                };

                $input.on('click', onChange);

                scope.$on('$destroy', () => {
                    el.off('click', onChange);
                });
            }
        }
    })
});
export default customCheckbox;
