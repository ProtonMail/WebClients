angular.module('proton.utils')
    .filter('labels', (authentication, $rootScope) => {
        let cache = [];

        const updateCache = () => {
            cache = _
                .chain(authentication.user.Labels)
                .where({ Exclusive: 0 })
                .sortBy(authentication.user.Labels, 'Order')
                .value();
        };

        $rootScope.$on('deleteLabel', () => updateCache());
        $rootScope.$on('createLabel', () => updateCache());
        $rootScope.$on('updateLabel', () => updateCache());
        $rootScope.$on('updateLabels', () => updateCache());
        $rootScope.$on('clearLabels', () => cache = []);

        return (labels = []) => {
            if (authentication.user) {
                !cache.length && updateCache();
                return _.filter(cache, ({ ID }) => labels.some((id) => id === ID));
            }

            return [];
        };
    });
