/* @ngInject */
function contactSignToggle(dispatchers) {
    return {
        scope: {
            model: '='
        },
        replace: true,
        restrict: 'E',
        templateUrl: require('../../../templates/contact/contactSignToggle.tpl.html'),
        link(scope) {
            const { on, unsubscribe } = dispatchers();
            const set = (value) => (scope.value = value);

            on('advancedSetting', (e, { type, data = {} }) => {
                if (type === 'update') {
                    scope.$applyAsync(() => {
                        set(data.model.Sign);
                    });
                }
            });

            set(scope.model);

            scope.$on('$destroy', () => {
                unsubscribe();
            });
        }
    };
}
export default contactSignToggle;
