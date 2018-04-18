import { MAILBOX_IDENTIFIERS } from '../../constants';

/* @ngInject */
function backState(dispatchers, $state, tools, mailSettingsModel) {
    /**
     * Keep a trace of the previous box state to let the user back to mail
     * Action present in the settings and contact sidebar
     */
    const CACHE = {};
    const cleanState = (state = '') => state.replace('.element', '');

    const { on } = dispatchers();

    on('$stateChangeSuccess', (e, toState, toParams, fromState = {}, fromParams = {}) => {
        if (fromState.name && MAILBOX_IDENTIFIERS[tools.filteredState(fromState.name)]) {
            const { ViewMode } = mailSettingsModel.get();

            CACHE.state = cleanState(fromState.name);
            CACHE.params = fromParams;
            CACHE.mode = ViewMode;
        }
    });

    function back() {
        const { ViewMode } = mailSettingsModel.get();
        // We can change the mode, prevent issue if an element was opened
        if (CACHE.state && CACHE.mode === ViewMode) {
            return $state.go(CACHE.state, CACHE.params);
        }

        if ($state.includes('secured.**')) {
            return $state.go('secured.inbox');
        }

        return $state.go('login');
    }

    return { init: angular.noop, back };
}
export default backState;
