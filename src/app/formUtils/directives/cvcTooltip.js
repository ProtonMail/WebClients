import tooltipModel from '../../utils/helpers/tooltipHelper';

/* @ngInject */
function cvcTooltip(gettextCatalog) {
    const line1 = gettextCatalog.getString(
        'For Visa, MasterCard and Discover, the 3 digits on the back of your card.',
        null,
        'Info'
    );
    const line2 = gettextCatalog.getString(
        'For American Express, the 4 digits on the front of your card.',
        null,
        'Info'
    );

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
                    <p>${line1}</p>
                    <p>${line2}</p>
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
