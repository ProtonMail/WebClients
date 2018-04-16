/* @ngInject */
function cvcTooltip(gettextCatalog) {
    const line1 = gettextCatalog.getString('For Visa, MasterCard and Discover, the 3 digits on the back of your card.', null, 'Info');
    const line2 = gettextCatalog.getString('For American Express, the 4 digits on the front of your card.', null, 'Info');
    const title = gettextCatalog.getString('Security Code', null, 'Credit card CVC');

    return {
        restrict: 'A',
        link(scope, element) {
            element[0].setAttribute('tabindex', 0);
            element[0].setAttribute('role', 'button');

            const options = {
                placement: 'top',
                container: 'body',
                html: true,
                title,
                trigger: 'focus',
                content: `
                    <p>${line1}</p>
                    <p>${line2}</p>
                `,
                template: `
                    <div class="popover" role="tooltip">
                        <div class="arrow"></div>
                        <div class="popover-title bold"></div>
                        <div class="popover-content"></div>
                    </div>
                `
            };
            element.popover(options);
            scope.$on('$destroy', () => {
                element.popover('destroy');
            });
        }
    };
}
export default cvcTooltip;
