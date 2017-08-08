angular.module('proton.elements')
    .directive('moveElement', () => ({
        replace: true,
        templateUrl: 'templates/elements/moveElement.tpl.html',
        link(scope, element) {
            function onClick(event) {
                if (event.target.tagName === 'BUTTON') {
                    const action = event.target.getAttribute('data-action');

                    if (action === 'delete') {
                        return scope.delete();
                    }

                    scope.move(action);
                }
            }

            element.on('click', onClick);

            scope.$on('$destroy', () => {
                element.off('click', onClick);
            });
        }
    }));
