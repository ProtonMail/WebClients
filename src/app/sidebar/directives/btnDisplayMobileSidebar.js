/* @ngInject */
function btnDisplayMobileSidebar(AppModel) {
    const CLASS_ICONS = {
        show: 'burger',
        hide: 'close'
    };

    return {
        replace: true,
        template:
            '<button class="btnDisplayMobileSidebar-container flex"><icon data-name="burger" data-fill="white" data-size="25" class="mauto"></icon></button>',
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
