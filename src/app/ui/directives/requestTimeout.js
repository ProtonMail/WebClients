angular.module('proton.ui')
.directive('requestTimeout', (AppModel) => {
    return {
        replace: true,
        templateUrl: 'templates/directives/ui/requestTimeout.tpl.html',
        link(scope, element) {
            const btn = element[0].querySelector('.request-timeout-button-refresh');

            const onClick = () => {
                AppModel.set('requestTimeout', false);

                scope.$applyAsync(() => {
                    scope.refreshElements();
                });

            };

            btn.addEventListener('click', onClick);

            scope.$on('$destroy', () => {
                btn.removeEventListener('click', onClick);
            });
        }
    };
});
