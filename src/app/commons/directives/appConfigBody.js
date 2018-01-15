import { CONSTANTS } from '../../constants';
/* @ngInject */
function appConfigBody($rootScope, AppModel, mailSettingsModel) {
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
        rows: className('rows')
    };

    return {
        link(scope, el) {
            AppModel.is('mobile') && el[0].classList.add(mapClassNames.mobile);
            AppModel.is('tablet') && el[0].classList.add(mapClassNames.tablet);

            const updateRows = () => {
                const { ViewLayout } = mailSettingsModel.get();
                const action = ViewLayout === CONSTANTS.ROW_MODE ? 'add' : 'remove';

                el[0].classList[action](mapClassNames.rows);
            };

            const toggleClass = (className, data = {}) => {
                const method = data.value ? 'add' : 'remove';
                _rAF(() => el[0].classList[method](className));
            };

            $rootScope.$on('AppModel', (e, { type, data }) => {
                const className = mapClassNames[type];
                className && toggleClass(className, data);
            });

            $rootScope.$on('mailSettings', (event, { type = '' }) => {
                if (type === 'updated') {
                    updateRows();
                }
            });

            updateRows();

            $rootScope.$on('$stateChangeSuccess', (e, toState) => {
                el[0].id = toState.name.replace(/[.]+/g, '-');
            });
        }
    };
}
export default appConfigBody;
