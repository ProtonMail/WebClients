angular.module('proton.ui')
    .directive('progressBar', ($rootScope) => {
        return {
            restrict: 'E',
            replace: true,
            template: '<progress class="progressBar"></progress>',
            scope: {},
            link(scope, element, { id = 'progress', max = 100 }) {
                const unsubscribe = $rootScope.$on('progressBar', (event, { type = '', data = {} }) => {
                    if (id === type) {
                        element[0].value = +data.progress;
                    }
                });

                element[0].value = 1;
                element[0].max = max;
                scope.$on('$destroy', unsubscribe);
            }
        };
    });
