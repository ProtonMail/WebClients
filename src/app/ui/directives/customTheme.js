/* @ngInject */
const customTheme = (AppModel, dispatchers, mailSettingsModel) => ({
    replace: true,
    template: '<style id="customTheme"></style>',
    link(scope, el) {
        const { on, unsubscribe } = dispatchers();
        const update = () => {
            const { isLoggedIn, isLocked } = AppModel.query();

            if (isLoggedIn && !isLocked) {
                el[0].textContent = mailSettingsModel.get('Theme');
            }
        };

        on('mailSettings', update);
        on('AppModel', update);

        update();

        scope.$on('$destroy', unsubscribe);
    }
});
export default customTheme;
