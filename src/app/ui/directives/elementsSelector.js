angular.module('proton.ui')
.directive('elementsSelector', ($rootScope, authentication, gettextCatalog) => {
    const isChecked = true;
    const actions = [
        { label: gettextCatalog.getString('All unread', null), icon: 'fa-eye-slash', action: 'unread' },
        { label: gettextCatalog.getString('All read', null), icon: 'fa-eye', action: 'read' },
        { label: gettextCatalog.getString('All unstarred', null), icon: 'fa-star-o', action: 'unstarred' },
        { label: gettextCatalog.getString('All starred', null), icon: 'fa-star', action: 'starred' }
    ];

    return {
        replace: true,
        templateUrl: 'templates/directives/ui/elementsSelector.tpl.html',
        compile(element) {
            const dropdown = element[0].querySelector('.pm_dropdown');
            const template = actions.reduce((prev, { label, icon, action }) => {
                return prev + `
                    <button data-action="${action}">
                        <i class="fa ${icon}"></i>
                        <span>${label}</span>
                    </button>
                `;
            }, '');

            dropdown.insertAdjacentHTML('beforeEnd', template);

            return (scope, el) => {
                const $btn = el.find('.element-selector-set-scope button');

                $btn.on('click', onClick);
                scope.value = 'all';

                function onClick({ currentTarget }) {
                    const value = currentTarget.getAttribute('data-action');
                    $rootScope.$emit('selectElements', { value, isChecked });
                    $rootScope.$emit('closeDropdown');
                }

                scope.checkedSelectorState = () => {
                    const { conversations = [] } = scope;
                    return (conversations.length) ? _.every(conversations, { Selected: true }) : false;
                };

                scope.$on('$destroy', () => {
                    $btn.off('click', onClick);
                });
            };
        }
    };
});
