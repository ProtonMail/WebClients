angular.module('proton.ui')
    .directive('multiselect', ($rootScope) => {
        return {
            replace: true,
            restrict: 'E',
            scope: {
                selected: '=',
                options: '='
            },
            templateUrl: 'templates/ui/multiselect.tpl.html',
            link(scope, elem, { name, disabled }) {

                const unsubscribe = [];

                scope.disabled = disabled === 'true';

                function onClick({ target }) {
                    if (target.classList.contains('multiselectLabel') ||
                        target.classList.contains('multiselectCheckbox')) {
                        scope.$applyAsync(() => {
                            if (name) {
                                $rootScope.$emit('multiselect', { name, type: 'update', data: { value: scope.selected } });
                            }
                        });
                    }
                }

                elem.on('click', onClick);
                unsubscribe.push(() => elem.off('click', onClick));

                scope.$on('$destroy', () => {
                    _.each(unsubscribe, (cb) => cb());
                    unsubscribe.length = 0;
                });
            }
        };
    });

