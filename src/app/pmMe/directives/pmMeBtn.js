/* @ngInject */
function pmMeBtn(gettextCatalog, pmMeModel) {
    const I18N = {
        ACTIVATE: gettextCatalog.getString('Activate @pm.me', null, 'Action')
    };

    const onClick = () => pmMeModel.activate();

    return {
        replace: true,
        restrict: 'E',
        template: `<button type="button">${I18N.ACTIVATE}</button>`,
        link(scope, el) {
            el.on('click', onClick);
            scope.$on('$destroy', () => {
                el.off('click', onClick);
            });
        }
    };
}
export default pmMeBtn;
