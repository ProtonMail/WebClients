/* @ngInject */
function toggle(dispatchers) {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: require('../../../templates/directives/toggle.tpl.html'),
        scope: {
            id: '@', // ID if uniq logic needed
            status: '=', // status value
            name: '@', // event name called
            type: '@' // type send with the event
        },
        link(scope, el, { action }) {
            const $checkbox = el.find('.pm_toggle-checkbox');
            const name = scope.name || action || 'toggle';
            const type = scope.type || '';
            const { dispatcher } = dispatchers([name]);
            const onChange = () => {
                if (name) {
                    dispatcher[name](type, {
                        status: scope.status,
                        id: scope.id
                    });
                }
            };

            $checkbox.on('change', onChange);

            // Make sure to pass a boolean to the ng-model checkbox
            scope.status = !!scope.status;

            scope.$on('$destroy', () => {
                $checkbox.off('change', onChange);
            });
        }
    };
}
export default toggle;
