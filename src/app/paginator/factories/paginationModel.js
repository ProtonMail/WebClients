import _ from 'lodash';

/* @ngInject */
function paginationModel(CONSTANTS, $injector, dispatchers, $state, $stateParams, mailSettingsModel, tools) {
    const { on } = dispatchers();

    const { ELEMENTS_PER_PAGE, MESSAGE_VIEW_MODE } = CONSTANTS;
    let currentState = '';

    on('$stateChangeSuccess', (e, state) => {
        currentState = state.name.replace('.element', '');
    });

    const getLayout = () => {
        if (mailSettingsModel.get('ViewMode') === MESSAGE_VIEW_MODE) {
            return 'message';
        }
        return 'conversation';
    };

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
            return Math.ceil(counter[getLayout()][key] / ELEMENTS_PER_PAGE);
        }

        return Math.ceil(cacheCounters.getCurrentState() / ELEMENTS_PER_PAGE);
    };

    /**
     * Auto Switch to another state
     * @param  {Object} opts    Custom options
     */
    const switchPage = (opts = {}) => {
        $state.go(currentState, _.extend({ id: null }, opts));
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
