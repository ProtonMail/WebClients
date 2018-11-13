/* @ngInject */
function progressBar(dispatchers) {
    return {
        restrict: 'E',
        replace: true,
        template: '<progress class="progressBar-container"></progress>',
        scope: {},
        compile(element, { max = 100 }) {
            element[0].value = 1;
            element[0].max = max;

            return (scope, el, { id }) => {
                const { on, unsubscribe } = dispatchers();
                on('progressBar', (e, { type = '', data = {} }) => {
                    const { progress = 0 } = data;

                    if (id === type) {
                        el[0].value = +progress;
                    }
                });

                scope.$on('$destroy', unsubscribe);
            };
        }
    };
}
export default progressBar;
