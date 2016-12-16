angular.module('proton.elements')
    .directive('advancedFilterElement', () => ({
        replace: true,
        templateUrl: 'templates/elements/advancedFilterElement.tpl.html',
        link(scope, el) {
            // const $a = el.find('a');
            // const onClick = (e) => {
            //     e.preventDefault();
            //     const action = e.target.getAttribute('data-action');
            //     if (action === 'delete') {
            //         return scope.delete();
            //     }
            //     scope.move(action);
            // };
            // $a.on('click', onClick);

            // scope.$on('$destroy', () => {
            //     $a.off('click', onClick);
            // });
        }
    }));
