angular.module('proton.elements')
.directive('countElementsSelected', ($rootScope) => {
    return {
        replace: true,
        templateUrl: 'templates/elements/countElementsSelected.tpl.html',
        link(scope, el) {
            const $btn = el.find('button');
            const onClick = () => $rootScope.$broadcast('unselectAllElements');

            $btn.on('click', onClick);

            scope.$on('$destroy', () => {
                $btn.off('click', onClick);
            });
        }
    };
});
