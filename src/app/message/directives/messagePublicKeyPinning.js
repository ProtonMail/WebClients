/* @ngInject */
function messagePublicKeyPinning(
    networkActivityTracker,
    gettextCatalog,
    settingsMailApi,
    notification,
    messageSenderSettings
) {
    const I18N = {
        SUCCES_MESSAGE_HIDE: gettextCatalog.getString('Banner permanently hidden', null, 'PGP key'),
        ERROR_MESSAGE_HIDE: gettextCatalog.getString('Error while updating setting', null, 'Error')
    };

    return {
        replace: true,
        restrict: 'E',
        templateUrl: require('../../../templates/message/messagePublicKeyPinning.tpl.html'),
        link(scope, el) {
            const neverShow = () => {
                const promise = settingsMailApi
                    .updatePromptPin({ PromptPin: 0 })
                    .then(() => scope.$applyAsync(() => (scope.message.promptKeyPinning = false)))
                    .then(() => notification.success(I18N.SUCCES_MESSAGE_HIDE))
                    .catch((error) => notification.error(error || I18N.ERROR_MESSAGE_HIDE));
                networkActivityTracker.track(promise);
            };

            const onClick = ({ target }) => {
                const { action = '' } = target.dataset;
                action === 'settings' &&
                    scope.$applyAsync(() => {
                        messageSenderSettings.showSettings(scope, { forceSender: true });
                    });
                action === 'never-show' && scope.$applyAsync(neverShow);
            };

            el[0].addEventListener('click', onClick);

            scope.$on('$destroy', () => {
                el[0].removeEventListener('click', onClick);
            });
        }
    };
}
export default messagePublicKeyPinning;
