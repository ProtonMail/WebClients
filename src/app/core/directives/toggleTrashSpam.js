angular.module('proton.core')
.directive('toggleTrashSpam', ($state, $stateParams, tools, gettextCatalog) => {
    const ON_ICON = 'fa-toggle-on';
    const OFF_ICON = 'fa-toggle-off';

    function onClick() {
        $state.go($state.$current.name, _.extend({}, $state.params, {
            trashspam: $stateParams.trashspam === '0' ? 1 : 0,
            page: undefined
        }));
    }
    function display(element) {
        const box = tools.currentMailbox();
        element.style.display = (['label', 'sent', 'drafts'].indexOf(box) > -1) ? 'block' : 'none';
    }
    function text(element) {
        const hideTrashSpam = angular.isUndefined($stateParams.trashspam) || $stateParams.trashspam === '0';
        const text = hideTrashSpam ? gettextCatalog.getString('Show trash and spam', null, 'Action') : gettextCatalog.getString('Hide trash and spam', null, 'Action');
        element.textContent = text;
    }
    function icon(element) {
        const hideTrashSpam = angular.isUndefined($stateParams.trashspam) || $stateParams.trashspam === '0';
        const className = hideTrashSpam ? ON_ICON : OFF_ICON;
        element.classList.add(className);
    }
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'templates/directives/core/toggleTrashSpam.tpl.html',
        link(scope, element) {
            const $link = element[0];
            const $span = element[0].querySelector('span');
            const $icon = element[0].querySelector('i');
            $link.addEventListener('click', onClick, false);
            scope.$on('$destroy', () => {
                $link.removeEventListener('click', onClick, false);
            });
            scope.$on('$stateChangeSuccess', () => {
                display($link);
                text($span);
            });
            display($link);
            text($span);
            icon($icon);
        }
    };
});
