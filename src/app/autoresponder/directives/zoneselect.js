import _ from 'lodash';

/* @ngInject */
function zoneselect(autoresponderModel, dispatchers) {
    return {
        replace: true,
        restrict: 'E',
        template:
            '<select id="time-zone" name="time-zone" ng-options="zone.label for zone in timezones track by zone.value" ng-model="zone"></select>',
        scope: {},
        link(scope, elem, { zone, disableInput }) {
            const { on, unsubscribe } = dispatchers();

            scope.timezones = autoresponderModel.timezones;

            if (disableInput === 'true') {
                elem.attr('disabled', 'disabled');
            }

            scope.zone = _.find(scope.timezones, { value: zone });

            const onChange = () => {
                scope.$applyAsync(() => autoresponderModel.set({ Zone: scope.zone.value }));
            };

            on('autoresponder', (event, { type, data = {} }) => {
                if (type === 'update') {
                    scope.zone = _.find(scope.timezones, { value: data.autoresponder.Zone });
                }
            });

            elem.on('change', onChange);

            scope.$on('$destroy', () => {
                elem.off('change', onChange);
                unsubscribe();
            });
        }
    };
}
export default zoneselect;
