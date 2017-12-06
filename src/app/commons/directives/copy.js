/* @ngInject */
function copy(gettextCatalog, notification) {
    const I18N = {
        copy: gettextCatalog.getString('Copy to your clipboard', null),
        copied: gettextCatalog.getString('Copied to clipboard', null)
    };

    return {
        restrict: 'E',
        replace: true,
        scope: { value: '=' },
        template: `
                <button class="copy-button" type="button" data-tooltip="${I18N.copy}">
                    <span class="copy-icon"></span>
                </button>
            `,
        link(scope, element) {
            const clipboard = new Clipboard(element[0], {
                text() {
                    return scope.value;
                }
            });

            clipboard.on('success', () => {
                element.attr('data-tooltip', I18N.copied); // NOTE doesn't work until we have CSS tooltip support
                notification.success(I18N.copied);
            });

            clipboard.on('error', () => {
                element.addClass('error');
            });

            scope.$on('$destroy', () => clipboard.destroy());
        }
    };
}
export default copy;
