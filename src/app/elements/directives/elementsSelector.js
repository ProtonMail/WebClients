import _ from 'lodash';
import dedentTpl from '../../../helpers/dedent';

/* @ngInject */
function elementsSelector(dispatchers, mailSettingsModel, gettextCatalog, $compile) {
    const ORDER_FALSY = ['all', 'read', 'unread', 'star', 'unstar'];
    const ORDER_TRUTHY = ['all', 'unread', 'read', 'unstar', 'star'];

    const ACTIONS = {
        all: {
            label: gettextCatalog.getString('Select All', null, 'Action'),
            icon: 'ordered-list',
            action: 'all'
        },
        unread: {
            label: gettextCatalog.getString('All Unread', null, 'Action'),
            icon: 'unread',
            action: 'unread'
        },
        read: {
            label: gettextCatalog.getString('All Read', null, 'Action'),
            icon: 'read',
            action: 'read'
        },
        unstar: {
            label: gettextCatalog.getString('All Unstarred', null, 'Action'),
            icon: 'star',
            action: 'unstarred'
        },
        star: {
            label: gettextCatalog.getString('All Starred', null, 'Action'),
            icon: 'starfull',
            action: 'starred'
        }
    };

    const map = (list) => list.map((key) => ACTIONS[key]);
    const orderActions = () => {
        const order = +mailSettingsModel.get('MessageButtons');

        if (!order) {
            return map(ORDER_FALSY);
        }

        return map(ORDER_TRUTHY);
    };

    const getTemplate = () => {
        return orderActions().reduce((acc, { label, icon, action }) => {
            const tpl = dedentTpl`<li class="dropDown-item pl1 pr1">
                <button data-action="${action}" class="elementsSelector-btn-action flex flex-nowrap w100 pt0-5 pb0-5 alignleft">
                    <icon name="${icon}" class="mt0-25 flex-item-noshrink"></icon>
                    <span class="ml0-5 mtauto mbauto">${label}</span>
                </button>
            </li>`;
            return acc + tpl;
        }, '');
    };

    function link(scope, el) {
        scope.$applyAsync(() => {
            const dropdownId = el[0].querySelector('.elementsSelector-dropdown').getAttribute('data-dropdown-id');

            el.find('.element-selector-set-scope')
                .empty()
                .append($compile(getTemplate())(scope));

            const { dispatcher, on, unsubscribe } = dispatchers(['dropdownApp', 'selectElements']);
            const $btn = el.find('.elementsSelector-btn-action');

            const allSelected = () => _.every(scope.conversations, { Selected: true });

            const updateView = () => {
                scope.$applyAsync(() => {
                    scope.viewLayout = mailSettingsModel.get('ViewLayout');
                });
            };
            on('mailSettings', (event, { type = '' }) => {
                if (type === 'updated') {
                    updateView();
                }
            });

            $btn.on('click', onClick);

            function onClick({ currentTarget }) {
                const action = currentTarget.getAttribute('data-action');
                dispatcher.selectElements(action, { isChecked: true });
                dispatcher.dropdownApp('action', {
                    type: 'close',
                    id: dropdownId
                });
            }

            scope.checkedSelectorState = allSelected;
            updateView();
            scope.$on('$destroy', () => {
                unsubscribe();
                $btn.off('click', onClick);
            });
        });
    }

    return {
        replace: true,
        templateUrl: require('../../../templates/elements/elementsSelector.tpl.html'),
        compile(el, { position }) {
            if (position) {
                el[0].querySelector('.elementsSelector-dropdown').setAttribute('data-position', position);
            }

            return link;
        }
    };
}
export default elementsSelector;
