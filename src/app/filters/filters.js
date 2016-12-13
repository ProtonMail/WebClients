angular.module('proton.filters')
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
})

/* Returns boolean */
.filter('showLabels', (authentication) => {
    return function (labels) {
        const labelsFiltered = [];
        const currentLabels = _.map(authentication.user.Labels, (label) => {
            return label.ID;
        });
        console.trace('LOL');

        _.each(labels, (label) => {
            let value = label;

            if (angular.isObject(label)) {
                value = label.ID;
            }

            if (currentLabels.indexOf(value) !== -1) {
                labelsFiltered.push(label);
            }
        });

        return labelsFiltered.length > 0 ? 1 : 0;
    };
});
