angular.module('proton.ui')
.directive('elementsSelector', ($rootScope, authentication, gettextCatalog) => {
    const isChecked = true;
    const actions = [
        { label: gettextCatalog.getString('All unread', null), icon: 'fa-eye-slash', scope: 'unread' },
        { label: gettextCatalog.getString('All read', null), icon: 'fa-eye', scope: 'read' },
        { label: gettextCatalog.getString('All unstarred', null), icon: 'fa-star-o', scope: 'unstarred' },
        { label: gettextCatalog.getString('All starred', null), icon: 'fa-star', scope: 'starred' }
    ];

    return {
        replace: true,
        templateUrl: 'templates/directives/ui/elementsSelector.tpl.html',
        link(scope) {
            scope.value = 'all';
            scope.actions = actions;

            scope.click = (value) => {
                $rootScope.$emit('selectElements', { value, isChecked });
                $rootScope.$emit('closeDropdown');
            };
        }
    };
});
