angular.module('proton.autoresponder')
    .directive('autoresponderTimeSection', (autoresponderModel, dateUtils, $rootScope) => {

        const days = _.map(dateUtils.getSortedWeekdays(), (day) => ({ value: day.value, label: day.shortLabel }));
        return {
            replace: true,
            restrict: 'E',
            templateUrl: 'templates/autoresponder/autoresponderTimeSection.tpl.html',
            scope: {
                form: '='
            },
            link(scope, elem, { mock }) {
                const unsubscribe = [];

                scope.days = days;
                scope.constants = autoresponderModel.constants;

                scope.timezones = autoresponderModel.timezones;
                scope.mock = mock === 'true';
                scope.model = autoresponderModel.get();

                unsubscribe.push($rootScope.$on('autoresponder', (event, { type, data = {} }) => {
                    if (type === 'update') {
                        scope.model = data.autoresponder;
                    }
                }));

                unsubscribe.push($rootScope.$on('multiselect', (event, { type, name, data = {} }) => {
                    if (type === 'update' && name === 'autoresponder.daysSelected') {
                        autoresponderModel.set({ daysSelected: data.value });
                    }
                }));

                scope.$on('$destroy', () => {
                    _.each(unsubscribe, (cb) => cb());
                    unsubscribe.length = 0;
                });
            }
        };
    });
