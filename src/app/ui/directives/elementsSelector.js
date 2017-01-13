angular.module('proton.ui')
    .directive('elementsSelector', ($rootScope) => ({
        replace: true,
        templateUrl: 'templates/directives/ui/elementsSelector.tpl.html',
        link(scope, element) {

            scope.value = 'all';

            const $btn = element.find('.element-selector-set-scope button');

            const onClick = ({ currentTarget }) => {
                scope
                    .$applyAsync(() => {
                        scope.value = currentTarget.dataset.scope;
                        $btn.removeClass('bold');
                        currentTarget.classList.add('bold');
                    });
                $rootScope.$emit('closeDropdown');
            };

            $btn.on('click', onClick);

            scope.$on('$destroy', () => {
                $btn.off('click', onClick);
            });
        }
    }));
