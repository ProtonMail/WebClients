import { MAILBOX_IDENTIFIERS } from '../../constants';

const prefix = (states) => states.map((name = '') => `secured.${name}`);
const DRAFTS_STATES = prefix(['allDrafts', 'drafts']);
const SENT_STATES = prefix(['allSent', 'sent']);
const DYNAMIC_STATES = [].concat(DRAFTS_STATES, SENT_STATES);
const DEFAULT_SECURED_STATE = 'secured.inbox';

/* @ngInject */
function backState(dispatchers, $state, tools, mailSettingsModel, dynamicStates) {
    /**
     * Keep a trace of the previous box state to let the user back to mail
     * Action present in the settings and contact sidebar
     */
    const CACHE = {};
    const cleanState = (state = '') => state.replace('.element', '');
    const getDynamicState = () => {
        if (DRAFTS_STATES.includes(CACHE.state)) {
            return dynamicStates.getDraftsState();
        }

        if (SENT_STATES.includes(CACHE.state)) {
            return dynamicStates.getSentState();
        }

        return DEFAULT_SECURED_STATE;
    };

    const { on } = dispatchers();

    on('$stateChangeSuccess', (e, toState, toParams, fromState = {}, fromParams = {}) => {
        if (fromState.name && MAILBOX_IDENTIFIERS[tools.filteredState(fromState.name)]) {
            const { ViewMode } = mailSettingsModel.get();

            CACHE.state = cleanState(fromState.name);
            CACHE.params = fromParams;
            CACHE.mode = ViewMode;
        }
    });

    on('mailSettings', (event, { type }) => {
        if (type === 'updated' && DYNAMIC_STATES.includes(CACHE.state)) {
            CACHE.state = getDynamicState();
        }
    });

    function back() {
        const { ViewMode } = mailSettingsModel.get();
        // We can change the mode, prevent issue if an element was opened
        if (CACHE.state && CACHE.mode === ViewMode) {
            return $state.go(CACHE.state, CACHE.params);
        }

        if ($state.includes('secured.**')) {
            return $state.go(DEFAULT_SECURED_STATE);
        }

        return $state.go('login');
    }

    return { init: angular.noop, back };
}
export default backState;
