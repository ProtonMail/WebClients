/* @ngInject */
function chooseLayoutBtns($rootScope, CONSTANTS, networkActivityTracker, tools, settingsMailApi, notification, gettextCatalog, mailSettingsModel) {
    const { COLUMN_MODE, ROW_MODE } = CONSTANTS;
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
                $rootScope.$emit('settings', { type: 'viewLayout.updated', data: { viewLayout: newLayout } });
                tools.mobileResponsive();
                notification.success(gettextCatalog.getString('Layout saved', null));
            });

            networkActivityTracker.track(promise);
        }

        angular
            .element('.toolbarDesktop-container')
            .find('a')
            .tooltip('hide');
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
