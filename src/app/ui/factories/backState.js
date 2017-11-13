angular.module('proton.ui')
    .factory('backState', ($rootScope, $state, CONSTANTS, tools) => {

        /**
         * Keep a trace of the previous box state to let the user back to mail
         * Action present in the settings and contact sidebar
         */
        const CACHE = {};
        const routes = Object.keys(CONSTANTS.MAILBOX_IDENTIFIERS);

        $rootScope.$on('$stateChangeSuccess', (event, toState, toParams, fromState = {}, fromParams = {}) => {
            if (_.contains(routes, tools.filteredState(fromState.name))) {
                CACHE.state = fromState.name;
                CACHE.params = fromParams;
            }
        });

        function back() {
            if (CACHE.state) {
                return $state.go(CACHE.state, CACHE.params);
            }

            if ($state.includes('secured.**')) {
                return $state.go('secured.inbox');
            }

            return $state.go('login');
        }

        return { init: angular.noop, back };
    });
