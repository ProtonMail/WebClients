angular.module('proton.ui')
.directive('slider', () => {
    return {
        replace: true,
        restrict: 'E',
        scope: { value: '=', options: '=' },
        templateUrl: 'templates/ui/slider.tpl.html',
        link(scope, element) {
            const slider = element[0].querySelector('.slider');

            if (scope.options.legend === 'GB') {
                slider.classList.add('slider-legend-GB');
            }

            if (scope.options.usedSpace) {
                slider.classList.add('slider-with-used-space');
                scope.usedSpace = scope.options.usedSpace;
            }

            noUiSlider.create(slider, scope.options);
            onChange();
            slider.noUiSlider.on('change', onChange);

            scope.$on('$destroy', () => {
                slider.noUiSlider.off('change', onChange);
                slider.noUiSlider.destroy();
            });

            scope.plus = () => {
                const newValue = Number(slider.noUiSlider.get()) + scope.options.step;

                if (newValue <= scope.options.range.max) {
                    slider.noUiSlider.set(newValue);
                    onChange();
                }
            };

            scope.minus = () => {
                const newValue = Number(slider.noUiSlider.get()) - scope.options.step;

                if (newValue >= scope.options.range.min) {
                    slider.noUiSlider.set(newValue);
                    onChange();
                }
            };

            function onChange() {
                let newValue = Number(slider.noUiSlider.get());

                if (newValue < scope.options.minPadding) {
                    newValue = scope.options.minPadding;
                    slider.noUiSlider.set(newValue);
                }

                if (newValue > scope.options.maxPadding) {
                    newValue = scope.options.maxPadding;
                    slider.noUiSlider.set(newValue);
                }

                scope.$applyAsync(() => {
                    scope.value = newValue;
                });
            }
        }
    };
});
