angular.module('proton.core')
    .factory('paginationModel', (CONSTANTS, cacheCounters, $rootScope, $state, $stateParams, authentication) => {

        const { ELEMENTS_PER_PAGE, MESSAGE_VIEW_MODE } = CONSTANTS;
        let currentState = '';
        let pageMax = 1;

        $rootScope.$on('$stateChangeSuccess', (e, state) => {
            currentState = state.name.replace('.element', '');
        });

        const getLayout = () => {
            if (authentication.user.ViewMode === MESSAGE_VIEW_MODE) {
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

            const counter = cacheCounters.getCounter($stateParams.label);
            if ($stateParams.label && counter) {
                return Math.ceil(counter[getLayout()].total / ELEMENTS_PER_PAGE);
            }

            return pageMax || Math.ceil(cacheCounters.getCurrentState() / ELEMENTS_PER_PAGE);
        };

        /**
         * Set the max page number where an user can go based on the total
         * of items displayable
         * @param  {Number} total
         * @return {void}
         */
        const setMaxPage = (total) => {
            const value = total || cacheCounters.getCurrentState();
            pageMax = Math.ceil(value / ELEMENTS_PER_PAGE);
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
                switchPage({ page: (page <= 1) ? undefined : page });
            }
        };

        /**
         * Auto switch to the next state until we can
         * @return {void}
         */
        const next = () => {
            const pos = ~~$stateParams.page || 1;
            const page = pos + 1;
            (page <= getMaxPage()) && switchPage({ page });
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
            init, next, previous,
            setMaxPage, getMaxPage, isMax,
            to: switchPage
        };

    });
