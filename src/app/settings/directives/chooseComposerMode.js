/* @ngInject */
function chooseComposerMode(dispatchers, composerSettings, mailSettingsModel) {
    const KEY = 'DraftMIMEType';

    return {
        replace: true,
        scope: {},
        templateUrl: require('../../../templates/settings/chooseComposerMode.tpl.html'),
        link(scope, el) {
            const { on, unsubscribe } = dispatchers();

            scope.model = mailSettingsModel.get(KEY);

            const onChange = ({ target }) => {
                const value = target.value;
                const textContent = target.querySelector(`[value="${value}"]`).textContent;
                composerSettings.updateComposerMode(value, textContent);
            };

            el.on('change', onChange);

            on('mailSettings', (event, { key, value = {} }) => {
                if (key === 'all') {
                    scope.model = value[KEY];
                }
            });

            scope.$on('$destroy', () => {
                unsubscribe();
                el.off('change', onChange);
            });
        }
    };
}

export default chooseComposerMode;
