/* @ngInject */
function btnDisplayMobileSidebar(AppModel, gettextCatalog) {
    const CLASS_ICONS = {
        show: 'burger',
        hide: 'close'
    };

    const I18N = {
        displayMenu: gettextCatalog.getString('Display menu', null, 'Action')
    };

    return {
        replace: true,
        template: `<button class="btnDisplayMobileSidebar-container flex"><icon data-name="burger" data-fill="white" data-size="25" class="mauto"></icon><span class="sr-only">${I18N.displayMenu}</span></button>`,
        compile(element, { type = 'show' }) {
            element[0].querySelector('icon').setAttribute('data-name', CLASS_ICONS[type]);

            return (scope, el, { type = 'show' }) => {
                const onClick = () => AppModel.set('showSidebar', type === 'show');
                el.on('click', onClick);

                scope.$on('$destroy', () => {
                    el.off('click', onClick);
                });
            };
        }
    };
}
export default btnDisplayMobileSidebar;
