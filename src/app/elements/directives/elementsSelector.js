import _ from 'lodash';
import dedentTpl from '../../../helpers/dedent';

/* @ngInject */
function elementsSelector(dispatchers, mailSettingsModel, gettextCatalog) {
    const ORDER_FALSY = ['all', 'read', 'unread', 'star', 'unstar'];
    const ORDER_TRUTHY = ['all', 'unread', 'read', 'unstar', 'star'];

    const ACTIONS = {
        all: {
            label: gettextCatalog.getString('Select All', null, 'Action'),
            icon: 'fa-check-square-o',
            action: 'all'
        },
        unread: {
            label: gettextCatalog.getString('All Unread', null, 'Action'),
            icon: 'fa-eye-slash',
            action: 'unread'
        },
        read: {
            label: gettextCatalog.getString('All Read', null, 'Action'),
            icon: 'fa-eye',
            action: 'read'
        },
        unstar: {
            label: gettextCatalog.getString('All Unstarred', null, 'Action'),
            icon: 'fa-star-o',
            action: 'unstarred'
        },
        star: {
            label: gettextCatalog.getString('All Starred', null, 'Action'),
            icon: 'fa-star',
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
        return orderActions().reduce((prev, { label, icon, action }) => {
            return (
                prev +
                dedentTpl(`
                    <button data-action="${action}" class="elementsSelector-btn-action">
                        <i class="fa ${icon}"></i>
                        <span>${label}</span>
                    </button>
                `)
            );
        }, '');
    };

    return {
        replace: true,
        templateUrl: require('../../../templates/elements/elementsSelector.tpl.html'),
        compile(element) {
            const dropdown = element[0].querySelector('.pm_dropdown');
            dropdown.insertAdjacentHTML('beforeEnd', getTemplate());

            return (scope, el) => {
                const { dispatcher, on, unsubscribe } = dispatchers(['closeDropdown', 'selectElements']);
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
                    dispatcher.closeDropdown();
                }

                scope.checkedSelectorState = allSelected;
                updateView();
                scope.$on('$destroy', () => {
                    unsubscribe();
                    $btn.off('click', onClick);
                });
            };
        }
    };
}
export default elementsSelector;
