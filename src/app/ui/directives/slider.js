import noUiSlider from 'nouislider';

/* @ngInject */
function slider(dispatchers) {
    return {
        replace: true,
        restrict: 'E',
        scope: { value: '=', options: '=' },
        templateUrl: require('../../../templates/ui/slider.tpl.html'),
        link(scope, element) {
            const { on, unsubscribe, dispatcher } = dispatchers(['slider.updated']);

            const slider = element[0].querySelector('.slider');
            const available = scope.options.range.max - scope.options.range.min;

            noUiSlider.create(slider, scope.options);

            onChange();

            slider.noUiSlider.on('change', onChange);

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

            scope.$watch('value', (newValue) => slider.noUiSlider.set(newValue));

            if (scope.options.type) {
                on('refresh.slider', (event, { type, data = {} }) => {
                    if (scope.options.type !== type) {
                        return;
                    }
                    slider.noUiSlider.set(data.value);
                    scope.$applyAsync(() => (scope.value = data.value));
                });

                on('update.slider.options', (event, { type, data = {} }) => {
                    if (scope.options.type !== type) {
                        return;
                    }
                    slider.noUiSlider.updateOptions(data.options);
                });

                on('enable.slider', (event, { type }) => {
                    if (scope.options.type !== type) {
                        return;
                    }
                    slider.removeAttribute('disabled');
                });

                on('disable.slider', (event, { type }) => {
                    if (scope.options.type !== type) {
                        return;
                    }
                    slider.setAttribute('disabled', true);
                });
            }

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

                    if (scope.options.type) {
                        dispatcher['slider.updated'](scope.options.type, { value: newValue });
                    }
                });
            }

            scope.$on('$destroy', () => {
                slider.noUiSlider.off('change', onChange);
                slider.noUiSlider.destroy();
                unsubscribe();
            });
        }
    };
}
export default slider;
