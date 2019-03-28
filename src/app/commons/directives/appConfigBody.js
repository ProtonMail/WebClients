import { ROW_MODE } from '../../constants';

import { isMac, isFirefox } from '../../../helpers/browser';

const SCROLL_STATES = ['signup', 'login.setup', 'secured.print'];
const LIGHT_STATES = ['support.reset-password', 'signup', 'login.setup', 'pre-invite'];
const LOCKED_STATES = ['login', 'eo.unlock', 'eo.message', 'reset', 'eo.reply'];

/* @ngInject */
function appConfigBody($state, AppModel, dispatchers, mailSettingsModel, subscriptionModel) {
    const included = (states = [], state = $state.$current.name) => states.includes(state);
    const userStates = ['isFree', 'isPaidMember', 'isPaidAdmin', 'isSubUser'];
    const className = (key = '') => `appConfigBody-${key}`;
    const mapClassNames = {
        isFree: className('is-free'),
        isPaidMember: className('is-paid-member'),
        isPaidAdmin: className('is-paid-admin'),
        isSubUser: className('is-sub-user'),
        mobile: className('is-mobile'),
        tablet: className('is-tablet'),
        mac: className('is-mac'),
        firefox: className('is-firefox'),
        requestTimeout: className('request-timeout'),
        tourActive: className('tourActive'),
        activeComposer: className('activeComposer'),
        maximizedComposer: className('maximizedComposer'),
        modalOpen: className('modalOpen'),
        showSidebar: className('showSidebar'),
        commandPalette: className('commandPalette'),
        rows: className('rows'),
        networkActivity: className('networkActivity'),
        moz: className('is-moz'),
        storageLimitReached: 'hasStickyMessages', // Note: Improve this if you need to add more sticky messages.
        isSecure: 'secure',
        isUnlock: 'unlock',
        newVersion: 'newVersion'
    };

    return {
        link(scope, el) {
            const { on, unsubscribe } = dispatchers();
            const { mobile, tablet } = AppModel.query();

            const updateRows = () => {
                const { ViewLayout } = mailSettingsModel.get();
                const action = ViewLayout === ROW_MODE ? 'add' : 'remove';

                el[0].classList[action](mapClassNames.rows);
            };

            const toggleClass = (className, value) => {
                const method = value ? 'add' : 'remove';
                _rAF(() => el[0].classList[method](className));
            };

            toggleClass(mapClassNames.firefox, isFirefox());
            toggleClass(mapClassNames.mac, isMac());

            on('AppModel', (e, { type, data = {} }) => {
                const className = mapClassNames[type];
                className && toggleClass(className, data.value);

                if (userStates.includes(type)) {
                    toggleClass(mapClassNames[type], data.value);
                }
            });

            on('mailSettings', (event, { type = '' }) => {
                if (type === 'updated') {
                    updateRows();
                }
            });

            on('$stateChangeSuccess', (e, toState) => {
                el[0].id = toState.name.replace(/[.]+/g, '-');

                toggleClass('scroll', included(SCROLL_STATES));
                toggleClass('light', included(LIGHT_STATES));
                toggleClass('locked', included(LOCKED_STATES));
            });

            on('subscription', (e, { type }) => {
                if (type === 'update') {
                    toggleClass(mapClassNames.moz, subscriptionModel.isMoz());
                }
            });

            toggleClass(mapClassNames.mobile, mobile);
            toggleClass(mapClassNames.tablet, tablet);
            updateRows();

            scope.$on('$destroy', unsubscribe);
        }
    };
}
export default appConfigBody;
