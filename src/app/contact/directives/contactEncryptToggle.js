/* @ngInject */
function contactEncryptToggle(dispatchers) {
    return {
        scope: {
            model: '='
        },
        replace: true,
        restrict: 'E',
        templateUrl: require('../../../templates/contact/contactEncryptToggle.tpl.html'),
        link(scope) {
            const { on, unsubscribe } = dispatchers();
            const set = (value) => (scope.value = value);

            on('advancedSetting', (e, { type, data = {} }) => {
                if (type === 'update') {
                    scope.$applyAsync(() => {
                        set(data.model.Encrypt);
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
export default contactEncryptToggle;
