/* @ngInject */
function autoresponderTimeSection(autoresponderModel, dateUtils, dispatchers) {
    return {
        replace: true,
        restrict: 'E',
        templateUrl: require('../../../templates/autoresponder/autoresponderTimeSection.tpl.html'),
        scope: {
            form: '='
        },
        link(scope, elem, { mock }) {
            const { on, unsubscribe } = dispatchers();

            scope.days = dateUtils.getDays('short');
            scope.constants = autoresponderModel.constants;

            scope.timezones = autoresponderModel.timezones;
            scope.mock = mock === 'true';
            scope.model = autoresponderModel.get();

            on('autoresponder', (event, { type, data = {} }) => {
                if (type === 'update') {
                    scope.model = data.autoresponder;
                }
            });

            on('multiselect', (event, { type, data: { name, value } }) => {
                if (type === 'update' && name === 'autoresponder.DaysSelected') {
                    autoresponderModel.set({ DaysSelected: value });
                }
            });

            scope.$on('$destroy', unsubscribe);
        }
    };
}
export default autoresponderTimeSection;
