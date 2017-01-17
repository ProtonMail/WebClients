angular.module('proton.ui')
.directive('elementsSelector', ($rootScope, authentication, gettextCatalog, dedentTpl) => {
    const isChecked = true;
    const ORDER_FALSY = ['read', 'unread', 'star', 'unstar'];
    const ORDER_TRUTHY = ['unread', 'read', 'unstar', 'star'];

    const ACTIONS = {
        unread: {
            label: gettextCatalog.getString('All unread', null),
            icon: 'fa-eye-slash',
            action: 'unread'
        },
        read: {
            label: gettextCatalog.getString('All read', null),
            icon: 'fa-eye',
            action: 'read'
        },
        unstar: {
            label: gettextCatalog.getString('All unstarred', null),
            icon: 'fa-star-o',
            action: 'unstarred'
        },
        star: {
            label: gettextCatalog.getString('All starred', null),
            icon: 'fa-star',
            action: 'starred'
        }
    };

    const map = (list) => list.map((key) => ACTIONS[key]);
    const orderActions = () => {
        const order = +authentication.user.MessageButtons;
        if (!order) {
            return map(ORDER_FALSY);
        }

        return map(ORDER_TRUTHY);
    };

    const getTemplate = () => {
        return orderActions()
            .reduce((prev, { label, icon, action }) => {
                return prev + dedentTpl(`
                    <button data-action="${action}" class="elementsSelector-btn-action">
                        <i class="fa ${icon}"></i>
                        <span>${label}</span>
                    </button>
                `);
            }, '');
    };

    return {
        replace: true,
        templateUrl: 'templates/directives/ui/elementsSelector.tpl.html',
        compile(element) {
            const dropdown = element[0].querySelector('.pm_dropdown');
            dropdown.insertAdjacentHTML('beforeEnd', getTemplate());

            return (scope, el) => {
                const $btn = el.find('.elementsSelector-btn-action');

                $btn.on('click', onClick);

                function onClick({ currentTarget }) {
                    const value = currentTarget.getAttribute('data-action');
                    $rootScope.$emit('selectElements', { value, isChecked });
                    $rootScope.$emit('closeDropdown');
                }

                scope.checkedSelectorState = () => _.every(scope.conversations, { Selected: true });

                scope.$on('$destroy', () => {
                    $btn.off('click', onClick);
                });
            };
        }
    };
});
