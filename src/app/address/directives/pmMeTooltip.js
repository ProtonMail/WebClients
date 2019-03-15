import tooltipModel from '../../utils/helpers/tooltipHelper';

/* @ngInject */
function pmMeTooltip(AppModel, premiumDomainModel, gettextCatalog, dispatchers, translator) {
    const I18N = translator(() => ({
        getTitle() {
            return gettextCatalog.getString(
                'This will add the {{email}} address to your account',
                { email: premiumDomainModel.email() },
                'Info'
            );
        }
    }));

    return {
        restrict: 'A',
        link(scope, el) {
            const { on, unsubscribe } = dispatchers();
            const tooltip = !AppModel.is('mobile') ? tooltipModel(el, { title: I18N.getTitle() }) : false;

            on('tooltip', (e, { type }) => {
                if (type === 'hideAll' && tooltip) {
                    tooltip.hide();
                }
            });

            scope.$on('$destroy', () => {
                tooltip && tooltip.dispose();
                unsubscribe();
            });
        }
    };
}
export default pmMeTooltip;
