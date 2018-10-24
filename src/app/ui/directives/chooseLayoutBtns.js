import { COLUMN_MODE, ROW_MODE } from '../../constants';

/* @ngInject */
function chooseLayoutBtns(
    dispatchers,
    networkActivityTracker,
    tools,
    settingsMailApi,
    notification,
    gettextCatalog,
    mailSettingsModel
) {
    const { dispatcher } = dispatchers(['settings']);
    const getLayout = (mode) => {
        const { ViewLayout } = mailSettingsModel.get();

        if (mode === 'rows' && ViewLayout === COLUMN_MODE) {
            return 1;
        }

        if (mode === 'columns' && ViewLayout === ROW_MODE) {
            return 0;
        }
    };

    const changeTo = (mode) => {
        const newLayout = getLayout(mode);

        if (angular.isDefined(newLayout)) {
            const promise = settingsMailApi.updateViewLayout({ ViewLayout: newLayout }).then(() => {
                dispatcher.settings('viewLayout.updated', { viewLayout: newLayout });
                tools.mobileResponsive();
                notification.success(gettextCatalog.getString('Layout saved', null, 'Info'));
            });

            networkActivityTracker.track(promise);
        }
    };

    return {
        replace: true,
        templateUrl: require('../../../templates/ui/chooseLayoutBtns.tpl.html'),
        link(scope, el) {
            const $a = el.find('a');
            const onClick = (e) => {
                e.preventDefault();
                changeTo(e.target.getAttribute('data-action'));
            };
            $a.on('click', onClick);
            scope.$on('$destroy', () => {
                $a.off('click', onClick);
            });
        }
    };
}
export default chooseLayoutBtns;
