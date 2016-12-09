angular.module('proton.core')
.directive('cvcTooltip', (gettextCatalog) => ({
    restrict: 'A',
    link(scope, element) {
        const line1 = gettextCatalog.getString('For Visa, MasterCard and Discover, the 3 digits on the back of your card.', null);
        const line2 = gettextCatalog.getString('For American Express, the 4 digits on the front of your card.', null);
        const title = gettextCatalog.getString('Security Code', null);
        const options = {
            placement: 'top',
            container: 'body',
            html: true,
            title,
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
            element.popover('destroy'); // it doesn't work, Bootstrap problem?
        });
    }
}));
