/* @ngInject */
function toolbarMobile(AppModel, dispatchers, mailSettingsModel) {
    return {
        replace: true,
        templateUrl: require('../../../templates/ui/toolbarMobile.tpl.html'),
        link(scope) {
            const { on, unsubscribe } = dispatchers();
            const updateNumberElementSelected = (value) => (scope.numberElementSelected = value);
            const updateView = () => {
                const { ViewLayout } = mailSettingsModel.get();
                scope.$applyAsync(() => {
                    scope.viewLayout = ViewLayout;
                });
            };

            on('AppModel', (event, { type, data = {} }) => {
                if (type === '') {
                    scope.$applyAsync(() => {
                        updateNumberElementSelected(data.value);
                    });
                }
            });

            on('mailSettings', (event, { type = '' }) => {
                if (type === 'updated') {
                    updateView();
                }
            });

            updateView();
            updateNumberElementSelected(AppModel.get('updateNumberElementSelected'));

            scope.$on('$destroy', unsubscribe);
        }
    };
}
export default toolbarMobile;
