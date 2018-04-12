import _ from 'lodash';

/* @ngInject */
function arrowsToScroll() {
    const BUTTON_CLASS = 'arrowsToScroll-button';
    const CONTAINER_CLASS = 'settingsDashboard-plans';

    return {
        restrict: 'A',
        compile(element) {
            element.append(`
                    <button class="${BUTTON_CLASS}" data-direction="left"></button>
                    <button class="${BUTTON_CLASS}" data-direction="right"></button>
                `);

            return (scope, element) => {
                const container = element.find(`.${CONTAINER_CLASS}`);
                const $buttons = element.find(`.${BUTTON_CLASS}`);
                const $left = element.find('[data-direction="left"]');
                const $right = element.find('[data-direction="right"]');
                const onResize = _.debounce(
                    () => $buttons.prop('disabled', container.get(0).scrollWidth < container.get(0).clientWidth),
                    300
                );
                const onScroll = _.debounce(() => {
                    const position = container.scrollLeft();
                    const maxScrollLeft = container.get(0).scrollWidth - container.get(0).clientWidth;

                    $left.prop('disabled', !position);
                    $right.prop('disabled', position === maxScrollLeft);
                }, 300);
                const onClick = (event) => {
                    if (event.target.classList.contains(BUTTON_CLASS)) {
                        const direction = event.target.getAttribute('data-direction');

                        switch (direction) {
                            case 'left':
                                container.animate({ scrollLeft: '-=350' });
                                break;
                            case 'right':
                                container.animate({ scrollLeft: '+=350' });
                                break;
                            default:
                                break;
                        }
                    }
                };

                container.on('scroll', onScroll);
                angular.element(window).on('resize', onResize);
                $buttons.on('click', onClick);

                onResize();
                onScroll();

                scope.$on('$destroy', () => {
                    container.off('scroll', onScroll);
                    angular.element(window).off('resize', onResize);
                    $buttons.off('click', onClick);
                });
            };
        }
    };
}
export default arrowsToScroll;
