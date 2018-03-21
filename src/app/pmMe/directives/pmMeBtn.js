/* @ngInject */
function pmMeBtn(gettextCatalog, pmMeModel) {
    const I18N = {
        activate(email) {
            return gettextCatalog.getString('Activate {{email}}', { email }, 'Action');
        }
    };

    const onClick = () => pmMeModel.activate();

    return {
        replace: true,
        restrict: 'E',
        template: `<button type="button">${I18N.activate(pmMeModel.email())}</button>`,
        link(scope, el) {
            el.on('click', onClick);
            scope.$on('$destroy', () => {
                el.off('click', onClick);
            });
        }
    };
}
export default pmMeBtn;
