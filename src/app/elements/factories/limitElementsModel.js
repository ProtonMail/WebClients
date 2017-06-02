angular.module('proton.elements')
    .factory('limitElementsModel', ($rootScope) => {
        const CACHE = {};
        const isReached = () => CACHE.total !== CACHE.limit;

        function set({ Limit = 0, Total = 0 }) {
            CACHE.limit = Limit;
            CACHE.total = Total;
        }

        $rootScope.$on('elements', (event, { type, data = {} }) => {
            (type === 'setLimit') && set(data);
        });

        return { init: angular.noop, isReached };
    });
