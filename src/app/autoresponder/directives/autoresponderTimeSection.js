import _ from 'lodash';

/* @ngInject */
function autoresponderTimeSection(autoresponderModel, dateUtils, dispatchers) {
    const days = _.map(dateUtils.getSortedWeekdays(), (day) => ({ value: day.value, label: day.shortLabel }));
    return {
        replace: true,
        restrict: 'E',
        templateUrl: require('../../../templates/autoresponder/autoresponderTimeSection.tpl.html'),
        scope: {
            form: '='
        },
        link(scope, elem, { mock }) {
            const { on, unsubscribe } = dispatchers();

            scope.days = days;
            scope.constants = autoresponderModel.constants;

            scope.timezones = autoresponderModel.timezones;
            scope.mock = mock === 'true';
            scope.model = autoresponderModel.get();

            on('autoresponder', (event, { type, data = {} }) => {
                if (type === 'update') {
                    scope.model = data.autoresponder;
                }
            });

            on('multiselect', (event, { type, name, data = {} }) => {
                if (type === 'update' && name === 'autoresponder.daysSelected') {
                    autoresponderModel.set({ daysSelected: data.value });
                }
            });

            scope.$on('$destroy', unsubscribe);
        }
    };
}
export default autoresponderTimeSection;
