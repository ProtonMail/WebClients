angular.module('proton.ui')
    .directive('customInputNumber', (customInputCreator) => {
        const postCompile = (scope, element, { step = 1 }) => {
            if (angular.isUndefined(scope.value)) {
                throw new Error('scope.value is undefined for the customInputNumber directive');
            }

            const $input = element.find('.customInputNumber-input');
            const $buttons = element.find('.customInputNumber-button');
            const get = () => scope.value;
            const set = (value) => {
                scope.$applyAsync(() => {
                    scope.value = value;
                    scope.onChange && scope.onChange();
                });
            };

            const actions = {
                plus() {
                    const value = get();

                    set(value + step);
                },
                minus() {
                    const value = get();

                    set(value - step);
                }
            };

            const onInput = (event) => set(event.target.value);

            function onClick(event) {
                if (event.target.tagName === 'BUTTON') {
                    const action = event.target.getAttribute('data-action');
                    actions[action]();
                }
            }

            $buttons.on('click', onClick);
            $input.on('input', onInput);

            scope.$on('$destroy', () => {
                $buttons.off('click', onClick);
                $input.off('input', onInput);
            });
        };

        return {
            restrict: 'E',
            replace: true,
            templateUrl: 'templates/ui/customInputNumber.tpl.html',
            compile: customInputCreator('number', { post: postCompile })
        };
    });
