/* @ngInject */
function chooseComposerMode(authentication, networkActivityTracker, settingsApi, notification, gettextCatalog, AppModel) {
    const I18N = {
        success(value) {
            return gettextCatalog.getString('Change composer mode to {{value}}', { value }, 'Info');
        }
    };

    const update = (MIMEType) => {
        const promise = settingsApi.updateDraftType({ MIMEType }).then(({ data = {} }) => {
            if (data.Code !== 1000) {
                throw new Error(data.Error);
            }
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
            AppModel.set('editorMode', authentication.user.DraftMIMEType);
            scope.model = authentication.user.DraftMIMEType;

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
