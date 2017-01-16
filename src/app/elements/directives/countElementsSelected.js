angular.module('proton.elements')
.directive('countElementsSelected', ($rootScope) => {
    return {
        replace: true,
        templateUrl: 'templates/elements/countElementsSelected.tpl.html',
        link(scope, element) {
            const $btn = element.find('.countElementsSelected-btn-unselect');
            const onClick = () => $rootScope.$emit('selectElements', { value: 'all', isChecked: false });

            $btn.on('click', onClick);

            scope.$on('$destroy', () => {
                $btn.off('click', onClick);
            });
        }
    };
});
