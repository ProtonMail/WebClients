angular.module('proton.elements')
    .directive('moveElement', () => ({
        replace: true,
        templateUrl: 'templates/elements/moveElement.tpl.html',
        link(scope, el) {
            const $a = el.find('a');
            const onClick = (e) => {
                e.preventDefault();
                const action = e.target.getAttribute('data-action');
                if (action === 'delete') {
                    return scope.delete();
                }
                scope.move(action);
            };
            $a.on('click', onClick);

            scope.$on('$destroy', () => {
                $a.off('click', onClick);
            });
        }
    }));
