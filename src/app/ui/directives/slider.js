angular.module('proton.ui')
.directive('slider', () => {
    return {
        restrict: 'E',
        scope: { value: '=', options: '=' },
        link(scope, element) {
            const slider = element[0];

            noUiSlider.create(slider, scope.options);

            slider.noUiSlider.on('change', onChange);

            scope.$watch('value', (newValue) => {
                slider.noUiSlider.set(newValue);
            });

            scope.$on('$destroy', () => {
                slider.noUiSlider.off('change', onChange);
                slider.noUiSlider.destroy();
            });

            function onChange() {
                scope.$applyAsync(() => {
                    scope.value = slider.noUiSlider.get();
                });
            }
        }
    };
});
