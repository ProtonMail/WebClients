/* @ngInject */
function toolbarDesktop(dispatchers, mailSettingsModel) {
    return {
        replace: true,
        templateUrl: require('../../../templates/ui/toolbarDesktop.tpl.html'),
        link(scope) {
            const { on, unsubscribe } = dispatchers();

            const updateView = (async = false) => {
                const {ViewLayout} = mailSettingsModel.get();
                if (async) {
                    scope.$applyAsync(() => {
                        scope.viewLayout = ViewLayout;
                    });
                } else {
                    scope.viewLayout = ViewLayout;
                }
            };

            on('mailSettings', (event, { type = '' }) => {
                if (type === 'updated') {
                    updateView(true);
                }
            });

            updateView();

            scope.$on('$destroy', unsubscribe);
        }
    };
}
export default toolbarDesktop;
