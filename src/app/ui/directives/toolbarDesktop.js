/* @ngInject */
function toolbarDesktop(dispatchers, mailSettingsModel) {
    return {
        replace: true,
        templateUrl: require('../../../templates/ui/toolbarDesktop.tpl.html'),
        link(scope) {
            const { on, unsubscribe } = dispatchers();

            const updateView = () => {
                const { ViewLayout } = mailSettingsModel.get();
                scope.$applyAsync(() => {
                    scope.viewLayout = ViewLayout;
                });
            };

            on('mailSettings', (event, { type = '' }) => {
                if (type === 'updated') {
                    updateView();
                }
            });

            updateView();

            scope.$on('$destroy', unsubscribe);
        }
    };
}
export default toolbarDesktop;
