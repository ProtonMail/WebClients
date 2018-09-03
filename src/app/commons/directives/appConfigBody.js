import { ROW_MODE } from '../../constants';

const SCROLL_STATES = ['signup', 'login.setup', 'secured.print'];
const LIGHT_STATES = ['support.reset-password', 'signup', 'login.setup', 'pre-invite', 'support.message'];
const LOCKED_STATES = ['login', 'login.unlock', 'eo.unlock', 'eo.message', 'reset', 'eo.reply'];

/* @ngInject */
function appConfigBody($state, AppModel, dispatchers, mailSettingsModel) {
    const included = (states = [], state = $state.$current.name) => states.includes(state);
    const className = (key = '') => `appConfigBody-${key}`;
    const mapClassNames = {
        mobile: className('is-mobile'),
        tablet: className('is-tablet'),
        requestTimeout: className('request-timeout'),
        tourActive: className('tourActive'),
        activeComposer: className('activeComposer'),
        maximizedComposer: className('maximizedComposer'),
        modalOpen: className('modalOpen'),
        showSidebar: className('showSidebar'),
        commandPalette: className('commandPalette'),
        rows: className('rows'),
        networkActivity: className('networkActivity'),
        isSecure: 'secure',
        isLocked: 'unlock'
    };

    return {
        link(scope, el) {
            const { on, unsubscribe } = dispatchers();
            const { mobile, tablet, isSecure, isLocked, isLoggedIn } = AppModel.query();

            const updateRows = () => {
                const { ViewLayout } = mailSettingsModel.get();
                const action = ViewLayout === ROW_MODE ? 'add' : 'remove';

                el[0].classList[action](mapClassNames.rows);
            };

            const toggleClass = (className, value) => {
                const method = value ? 'add' : 'remove';
                _rAF(() => el[0].classList[method](className));
            };

            on('AppModel', (e, { type, data = {} }) => {
                const className = mapClassNames[type];
                className && toggleClass(className, data.value);

                if (type === 'isLoggedIn') {
                    const { isLoggedIn, isLocked } = AppModel.query();

                    toggleClass('login', !isLoggedIn);
                    toggleClass('locked', included(LOCKED_STATES) || (isLoggedIn && isLocked));
                }

                if (type === 'isLocked') {
                    const { isLoggedIn, isLocked } = AppModel.query();

                    toggleClass('locked', included(LOCKED_STATES) || (isLoggedIn && isLocked));
                }
            });

            on('mailSettings', (event, { type = '' }) => {
                if (type === 'updated') {
                    updateRows();
                }
            });

            on('$stateChangeSuccess', (e, toState) => {
                const { isLoggedIn, isLocked } = AppModel.query();

                el[0].id = toState.name.replace(/[.]+/g, '-');

                toggleClass('scroll', included(SCROLL_STATES));
                toggleClass('light', included(LIGHT_STATES));
                toggleClass('locked', included(LOCKED_STATES) || (isLoggedIn && isLocked));
            });

            toggleClass('login', !isLoggedIn);
            toggleClass(mapClassNames.mobile, mobile);
            toggleClass(mapClassNames.tablet, tablet);
            toggleClass(mapClassNames.isSecure, isSecure);
            toggleClass(mapClassNames.isLocked, isLocked);
            updateRows();

            scope.$on('$destroy', unsubscribe);
        }
    };
}
export default appConfigBody;
