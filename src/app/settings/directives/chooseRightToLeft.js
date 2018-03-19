/* @ngInject */
function chooseRightToLeft(dispatchers, composerSettings, mailSettingsModel) {
    const KEY = 'RightToLeft';

    return {
        restrict: 'E',
        replace: true,
        scope: {},
        templateUrl: 'templates/settings/chooseRightToLeft.tpl.html',
        link(scope, el) {
            const { on, unsubscribe } = dispatchers();

            scope.model = '' + (mailSettingsModel.get(KEY) || 0);

            const onChange = ({ target }) => {
                const rightToLeft = parseInt(target.value, 10);
                const textContent = target.querySelector(`[value="${target.value}"]`).textContent;
                composerSettings.updateRightToLeft(rightToLeft, textContent);
            };

            el.on('change', onChange);

            on('mailSettings', (event, { key, value = {} }) => {
                if (key === 'all') {
                    scope.model = '' + value[KEY];
                }
            });

            scope.$on('$destroy', () => {
                unsubscribe();
                el.off('change', onChange);
            });
        }
    };
}

export default chooseRightToLeft;
