/* @ngInject */
function btnAdvancedSearch(dispatchers) {
    const CLASSNAME = {
        down: 'fa-angle-down',
        up: 'fa-angle-up',
        close: 'fa-times'
    };

    return {
        replace: true,
        templateUrl: require('../../../templates/search/btnAdvancedSearch.tpl.html'),
        link(scope, el, { action = 'show' }) {
            const { on, unsubscribe, dispatcher } = dispatchers(['advancedSearch']);
            const dispatch = (type, data = {}) => dispatcher.advancedSearch(type, data);

            const $icon = el[0].querySelector('.btnAdvancedSearch-icon-desktop');
            let isOpen = false;

            if (action === 'close') {
                $icon.classList.remove(CLASSNAME.down);
                $icon.classList.add(CLASSNAME.close);
            }

            on('advancedSearch', (e, { type, data }) => {
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
                unsubscribe();
            });
        }
    };
}
export default btnAdvancedSearch;
