angular.module('proton.ui')
    .factory('backState', ($rootScope, $state, CONSTANTS, tools, authentication) => {

        const { MAILBOX_IDENTIFIERS } = CONSTANTS;

        /**
         * Keep a trace of the previous box state to let the user back to mail
         * Action present in the settings and contact sidebar
         */
        const CACHE = {};

        $rootScope.$on('$stateChangeSuccess', (e, toState, toParams, fromState = {}, fromParams = {}) => {
            if (fromState.name && MAILBOX_IDENTIFIERS[tools.filteredState(fromState.name)]) {
                CACHE.state = fromState.name;
                CACHE.params = fromParams;
                CACHE.mode = authentication.user.ViewMode;
            }
        });

        function back() {
            // We can change the mode, prevent issue if an element was opened
            if (CACHE.state && CACHE.mode === authentication.user.ViewMode) {
                return $state.go(CACHE.state, CACHE.params);
            }

            if ($state.includes('secured.**')) {
                return $state.go('secured.inbox');
            }

            return $state.go('login');
        }

        return { init: angular.noop, back };
    });
