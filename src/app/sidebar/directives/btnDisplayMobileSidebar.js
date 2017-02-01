angular.module('proton.sidebar')
    .directive('btnDisplayMobileSidebar', ($rootScope) => {

        const CLASS_ICONS = {
            show: 'fa-bars',
            hide: 'fa-times'
        };

        return {
            replace: true,
            template: '<button class="pm_button btnDisplayMobileSidebar-container"><i class="fa"></i></button>',
            compile(element, { type = 'show' }) {

                element[0].querySelector('i').classList.add(CLASS_ICONS[type]);

                return (scope, el, { type = 'show' }) => {
                    const onClick = () => $rootScope.$emit('sidebarMobileToggle', type === 'show');
                    el.on('click', onClick);

                    scope.$on('$destroy', () => {
                        el.off('click', onClick);
                    });
                };
            }
        };
    });
