/* @ngInject */
function pmMeBtn(gettextCatalog, pmMeModel, premiumDomainModel, translator) {
    const I18N = translator(() => ({
        activate(email) {
            return gettextCatalog.getString('Activate {{email}}', { email }, 'Action');
        }
    }));

    const onClick = () => pmMeModel.activate();

    return {
        replace: true,
        restrict: 'E',
        template: '<button class="pmMeBtn-container" type="button"></button>',
        link(scope, el) {
            el[0].textContent = I18N.activate(premiumDomainModel.email());
            el.on('click', onClick);
            scope.$on('$destroy', () => {
                el.off('click', onClick);
            });
        }
    };
}
export default pmMeBtn;
