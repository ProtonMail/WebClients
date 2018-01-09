/* @ngInject */
function wildcardModel($rootScope, gettextCatalog, networkActivityTracker, notification, settingsMailApi) {
    const I18N = {
        success: gettextCatalog.getString('Search parameter updated')
    };

    function updateAutowildcard({ AutoWildcardSearch }) {
        const promise = settingsMailApi.updateAutowildcard({ AutoWildcardSearch }).then(() => notification.success(I18N.success));

        networkActivityTracker.track(promise);
    }

    $rootScope.$on('settings', (event, { type, data = {} }) => {
        type === 'autowildcard.update' && updateAutowildcard(data);
    });

    return { init: angular.noop };
}
export default wildcardModel;
