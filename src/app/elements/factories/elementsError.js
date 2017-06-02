angular.module('proton.elements')
    .factory('elementsError', ($rootScope) => {
        const errors = [];

        function last() {
            if (errors.length) {
                return _.last(errors);
            }
            return {};
        }

        $rootScope.$on('elements', (event, { type, data = {} }) => {
            if (type === 'error') {
                errors.push(data);
            }
        });

        $rootScope.$on('$stateChangeSuccess', () => {
            errors.length = 0;
        });

        return { init: angular.noop, last };
    });
