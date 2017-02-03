angular.module('proton.search')
    .directive('btnAdvancedSearch', ($rootScope) => {

        const CLASSNAME = {
            down: 'fa-angle-down',
            up: 'fa-angle-up',
            close: 'fa-times'
        };

        const dispatch = (type, data = {}) => $rootScope.$emit('advancedSearch', { type, data });

        return {
            replace: true,
            templateUrl: 'templates/search/btnAdvancedSearch.tpl.html',
            link(scope, el, { action = 'show' }) {
                const $icon = el[0].querySelector('.btnAdvancedSearch-icon-desktop');
                let isOpen = false;

                if (action === 'close') {
                    $icon.classList.remove(CLASSNAME.down);
                    $icon.classList.add(CLASSNAME.close);
                }

                $rootScope.$on('advancedSearch', (e, { type, data }) => {
                    if (type === 'open' && action === 'show') {
                        const add = data.visible ? CLASSNAME.up : CLASSNAME.down;
                        const remove = data.visible ? CLASSNAME.down : CLASSNAME.up;
                        $icon.classList.remove(remove);
                        $icon.classList.add(add);
                        isOpen = data.visible;
                    }
                });

                const onClick = () => {
                    if (action === 'close') {
                        return dispatch('open', { visible: false });
                    }
                    dispatch('open', { visible: (isOpen = !isOpen) });
                };

                el.on('click', onClick);

                scope.$on('$destroy', () => {
                    el.off('click', onClick);
                });
            }
        };
    });
