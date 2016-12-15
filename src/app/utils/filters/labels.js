angular.module('proton.utils')
    .filter('labels', (authentication, $rootScope) => {

        let cache = [];
        const updateCache = () => {
            cache = _.sortBy(authentication.user.Labels, 'Order');
        };

        $rootScope.$on('deleteLabel', () => updateCache());
        $rootScope.$on('createLabel', () => updateCache());
        $rootScope.$on('updateLabel', () => updateCache());
        $rootScope.$on('updateLabels', () => updateCache());

        return (labels = []) => {
            if (authentication.user) {
                (!cache.length) && updateCache();
                return _.filter(cache, ({ ID }) => labels.some((id) => id === ID));
            }

            return [];
        };
    });
