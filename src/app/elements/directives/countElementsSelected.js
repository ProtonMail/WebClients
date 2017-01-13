angular.module('proton.elements')
.directive('countElementsSelected', ($rootScope) => {
    return {
        replace: true,
        templateUrl: 'templates/elements/countElementsSelected.tpl.html',
        link(scope, element) {
            const $btn = element[0].querySelector('button');
            const onClick = () => $rootScope.$broadcast('unselectAllElements');

            $btn.addEventListener('click', onClick);

            scope.$on('$destroy', () => {
                $btn.removeEventListener('click', onClick);
            });
        }
    };
});
