angular.module('proton.elements')
.directive('countElementsSelected', ($rootScope) => {
    return {
        replace: true,
        templateUrl: 'templates/elements/countElementsSelected.tpl.html',
        link(scope, element) {
            const $btn = element.find('.countElementsSelected-btn-unselect');
            const onClick = () => $rootScope.$broadcast('selectElements', { value: 'all', isChecked: 0 });

            $btn.addEventListener('click', onClick);

            scope.$on('$destroy', () => {
                $btn.removeEventListener('click', onClick);
            });
        }
    };
});
