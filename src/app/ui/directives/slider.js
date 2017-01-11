angular.module('proton.ui')
.directive('slider', () => {
    return {
        replace: true,
        restrict: 'E',
        scope: { value: '=', options: '=' },
        templateUrl: 'templates/ui/slider.tpl.html',
        link(scope, element) {
            const slider = element[0].querySelector('.slider');
            const available = scope.options.range.max - scope.options.range.min;

            noUiSlider.create(slider, scope.options);

            scope.value = scope.options.start;
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

            scope.$applyAsync(() => minMax());

            function usedSpace(unit) {
                return (unit / available) * 100 + '%';
            }

            function moveNodes(node, newParent) {
                newParent.appendChild(node);
            }

            function minMax() {
                const sliderBase = slider.querySelector('.noUi-base');

                if (scope.options.minPadding) {
                    const minPadding = slider.querySelector('.slider-min-padding');
                    moveNodes(minPadding, sliderBase);
                    minPadding.style.width = usedSpace(scope.options.minPadding);
                }

                if (scope.options.maxPadding) {
                    const maxPadding = slider.querySelector('.slider-max-padding');
                    moveNodes(maxPadding, sliderBase);
                    scope.maxPadding = scope.options.range.max - scope.options.maxPadding;
                    maxPadding.style.width = usedSpace(scope.maxPadding);
                }
            }

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
