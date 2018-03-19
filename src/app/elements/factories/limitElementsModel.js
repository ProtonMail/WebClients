/* @ngInject */
function limitElementsModel(dispatchers) {
    const CACHE = {};
    const isReached = () => CACHE.total !== CACHE.limit;
    const { on } = dispatchers();

    function set({ Limit = 0, Total = 0 }) {
        CACHE.limit = Limit;
        CACHE.total = Total;
    }

    on('elements', (event, { type, data = {} }) => {
        type === 'setLimit' && set(data);
    });

    return { init: angular.noop, isReached };
}
export default limitElementsModel;
