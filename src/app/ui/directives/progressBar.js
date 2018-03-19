/* @ngInject */
function progressBar(dispatchers) {
    return {
        restrict: 'E',
        replace: true,
        template: '<progress class="progressBar-container"></progress>',
        scope: {},
        compile(element, { id = 'progress', max = 100 }) {
            element[0].value = 1;
            element[0].max = max;

            return (scope) => {
                const { on, unsubscribe } = dispatchers();

                on('progressBar', (event, { type = '', data = {} }) => {
                    const { progress = 0 } = data;

                    if (id === type) {
                        element[0].value = +progress;
                    }
                });

                scope.$on('$destroy', unsubscribe);
            };
        }
    };
}
export default progressBar;
