/* @ngInject */
function wildcardModel(dispatchers, gettextCatalog, networkActivityTracker, notification, settingsMailApi) {
    const I18N = {
        success: gettextCatalog.getString('Search parameter updated')
    };
    const { on } = dispatchers();

    function updateAutowildcard({ AutoWildcardSearch }) {
        const promise = settingsMailApi
            .updateAutowildcard({ AutoWildcardSearch })
            .then(() => notification.success(I18N.success));

        networkActivityTracker.track(promise);
    }

    on('settings', (event, { type, data = {} }) => {
        type === 'autowildcard.update' && updateAutowildcard(data);
    });

    return { init: angular.noop };
}
export default wildcardModel;
