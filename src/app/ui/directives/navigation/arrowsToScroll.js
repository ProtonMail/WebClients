// Used in the dashboard plans to scroll on the left or right
angular.module('proton.ui')
    .directive('arrowsToScroll', () => {
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

                    const onScroll = () => {
                        const position = container.scrollLeft();
                        const maxScrollLeft = container.get(0).scrollWidth - container.get(0).clientWidth;

                        element.find('[data-direction="left"]').prop('disabled', !position);
                        element.find('[data-direction="right"]').prop('disabled', position === maxScrollLeft);
                    };
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
                    angular.element(window).on('resize', onScroll);
                    $buttons.on('click', onClick);

                    setTimeout(() => onScroll(), 1000);

                    scope.$on('$destroy', () => {
                        container.off('scroll', onScroll);
                        angular.element(window).off('resize', onScroll);
                        $buttons.off('click', onClick);
                    });
                };
            }
        };
    });
