/* @ngInject */
function copy(gettextCatalog, ptClipboard, translator) {
    const I18N = translator(() => ({
        copy: gettextCatalog.getString('Copy to your clipboard', null, 'Info')
    }));

    return {
        restrict: 'E',
        replace: true,
        scope: { value: '=' },
        template: `<button class="copy-button" type="button" data-tooltip="${
            I18N.copy
        }"><span class="copy-icon"></span></button>`,
        link(scope, el) {
            const { promise, destroy, I18N: clipboardI18N } = ptClipboard(el[0], () => {
                return scope.value;
            });

            // NOTE doesn't work until we have CSS tooltip support
            promise.then(() => el.attr('data-tooltip', clipboardI18N.SUCCESS)).catch(() => el.addClass('error'));

            scope.$on('$destroy', () => destroy());
        }
    };
}
export default copy;
