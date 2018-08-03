/* @ngInject */
const customTheme = (dispatchers, mailSettingsModel) => ({
    replace: true,
    template: '<style id="customTheme"></style>',
    link(scope, el) {
        const { on, unsubscribe } = dispatchers();
        const update = () => (el[0].textContent = mailSettingsModel.get('Theme'));

        on('mailSettings', update);
        update();
        scope.$on('$destroy', unsubscribe);
    }
});
export default customTheme;
