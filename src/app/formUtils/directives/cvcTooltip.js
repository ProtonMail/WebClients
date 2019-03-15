import tooltipModel from '../../utils/helpers/tooltipHelper';

/* @ngInject */
function cvcTooltip(gettextCatalog, translator) {
    const I18N = translator(() => ({
        TITLE: gettextCatalog.getString('Security Code', null, 'Credit card CVC'),
        LINE1: gettextCatalog.getString(
            'For Visa, MasterCard and Discover, the 3 digits on the back of your card.',
            null,
            'Info'
        ),
        LINE2: gettextCatalog.getString('For American Express, the 4 digits on the front of your card.', null, 'Info')
    }));

    return {
        restrict: 'A',
        link(scope, element) {
            element[0].setAttribute('tabindex', 0);
            element[0].setAttribute('role', 'button');

            const options = {
                container: '.cardView-container',
                trigger: 'focus',
                html: true,
                title: `
                    <h4>${I18N.TITLE}</h4>
                    <p>${I18N.LINE1}</br>${I18N.LINE2}</p>
                `
            };

            const tooltip = tooltipModel(element, options);

            scope.$on('$destroy', () => {
                tooltip.dispose();
            });
        }
    };
}
export default cvcTooltip;
