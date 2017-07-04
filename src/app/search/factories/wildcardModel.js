angular.module('proton.search')
    .factory('wildcardModel', ($rootScope, authentication, gettextCatalog, networkActivityTracker, notify, settingsApi) => {
        const I18N = {
            success: gettextCatalog.getString('Search parameter updated')
        };

        function updateAutowildcard({ AutoWildcardSearch }) {
            const promise = settingsApi.updateAutowildcard({ AutoWildcardSearch })
                .then(({ data = {} } = {}) => {
                    if (data.Code === 1000) {
                        authentication.user.AutoWildcardSearch = AutoWildcardSearch;
                        return Promise.resolve();
                    }
                    throw new Error(data.Error);
                })
                .then(() => notify({ message: I18N.success, classes: 'notification-success' }));

            networkActivityTracker.track(promise);
        }

        $rootScope.$on('settings', (event, { type, data = {} }) => {
            (type === 'autowildcard.update') && updateAutowildcard(data);
        });

        return { init: angular.noop };
    });
