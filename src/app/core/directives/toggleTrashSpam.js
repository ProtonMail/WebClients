angular.module('proton.core')
.directive('toggleTrashSpam', ($state, $stateParams, tools) => {
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
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'templates/directives/core/toggleTrashSpam.tpl.html',
        link(scope, element) {
            const $link = element[0];
            $link.addEventListener('click', onClick, false);
            scope.$on('$destroy', () => {
                $link.removeEventListener('click', onClick, false);
            });
            scope.$on('$stateChangeSuccess', () => {
                display($link);
            });
            display($link);
        }
    };
});
