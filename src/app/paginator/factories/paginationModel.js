import { ELEMENTS_PER_PAGE } from '../../constants';

/* @ngInject */
function paginationModel($injector, dispatchers, $state, $stateParams, tools) {
    const { on } = dispatchers();
    let currentState = '';

    on('$stateChangeSuccess', (e, state) => {
        currentState = state.name.replace('.element', '');
    });

    /**
     * Get the max page where an user can go
     * If we load a label we need to compute the total page using the cache counter.
     * The currentState does not refresh as the list of messages/converstations might be already inside the cache itself.
     * @return {Integer}
     */
    const getMaxPage = () => {
        const cacheCounters = $injector.get('cacheCounters');
        const counter = cacheCounters.getCounter(tools.currentLocation());

        if (tools.cacheContext() && counter) {
            const key = $stateParams.filter === 'unread' ? 'unread' : 'total';
            const type = tools.getTypeList();
            return Math.ceil(counter[type][key] / ELEMENTS_PER_PAGE);
        }

        return Math.ceil(cacheCounters.getCurrentState() / ELEMENTS_PER_PAGE);
    };

    /**
     * Auto Switch to another state
     * @param  {Object} opts    Custom options
     */
    const switchPage = (opts = {}) => {
        $state.go(currentState, { id: null, ...opts });
    };

    /**
     * Auto switch to the previous state if we can
     * @return {void}
     */
    const previous = () => {
        const pos = ~~$stateParams.page || 0;
        if (pos) {
            const page = pos - 1;
            // If page = 1 remove it from the url
            switchPage({ page: page <= 1 ? undefined : page });
        }
    };

    /**
     * Auto switch to the next state until we can
     * @return {void}
     */
    const next = () => {
        const pos = ~~$stateParams.page || 1;
        const page = pos + 1;
        page <= getMaxPage() && switchPage({ page });
    };

    /**
     * Check if the current state is the last page
     * Return also true if we try to display a page > max
     * @return {Boolean}
     */
    const isMax = () => {
        const page = ~~$stateParams.page || 1;
        return page >= getMaxPage();
    };

    const init = angular.noop;
    return {
        init,
        next,
        previous,
        getMaxPage,
        isMax,
        to: switchPage
    };
}
export default paginationModel;
