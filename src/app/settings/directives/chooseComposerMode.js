/* @ngInject */
function chooseComposerMode(authentication, networkActivityTracker, settingsMailApi, notification, gettextCatalog, AppModel, mailSettingsModel) {
    const I18N = {
        success(value) {
            return gettextCatalog.getString('Change composer mode to {{value}}', { value }, 'Info');
        }
    };

    const update = (MIMEType) => {
        const promise = settingsMailApi.updateDraftType({ MIMEType }).then(() => {
            AppModel.set('editorMode', MIMEType);
        });

        networkActivityTracker.track(promise);

        return promise;
    };

    return {
        replace: true,
        scope: {},
        templateUrl: require('../../../templates/settings/chooseComposerMode.tpl.html'),
        link(scope, el) {
            const { DraftMIMEType } = mailSettingsModel.get();

            AppModel.set('editorMode', DraftMIMEType);
            scope.model = DraftMIMEType;

            const onChange = ({ target }) => {
                update(target.value)
                    .then(() => {
                        scope.$applyAsync(() => (scope.model = target.value));
                        notification.success(I18N.success(target.selectedOptions[0].textContent));
                    })
                    .then(() => authentication.fetchUserInfo());
            };

            el.on('change', onChange);

            scope.$on('$destroy', () => {
                el.off('change', onChange);
            });
        }
    };
}
export default chooseComposerMode;
