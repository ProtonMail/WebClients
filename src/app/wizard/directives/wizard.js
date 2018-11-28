/* @ngInject */
function wizard(dispatchers, $stateParams, $timeout, $state, welcomeModal, wizardBuilder, AppModel) {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: require('../../../templates/partials/wizard.tpl.html'),
        link(scope, element) {
            const { on, unsubscribe } = dispatchers();
            const show = () => element[0].classList.remove('wizardStep-hidden');
            const hide = () => element[0].classList.add('wizardStep-hidden');
            const has = () => element[0].classList.contains('wizardStep-hidden');
            const welcome = function() {
                welcomeModal.activate({
                    params: {
                        cancel() {
                            welcomeModal.deactivate();
                        },
                        next() {
                            welcomeModal.deactivate();

                            if (!AppModel.is('mobile')) {
                                tourStart();
                            }
                        }
                    }
                });
            };

            // Initialization
            $timeout(() => {
                if ($stateParams.welcome) {
                    welcome();
                }
            }, 0);

            /**
             * Listen to the differents actions
             *   - touchStart: Display the wizard
             *   - touchEnd: Close the wizard
             *   - touchNext: Display the next slide
             *   - touchGo: Going to a slide by its position
             */
            on('tourActions', (e, { type, data = {} }) => {
                type === 'tourStart' && tourStart();
                type === 'tourEnd' && tourEnd();
                type === 'tourNext' && tourNext();
                type === 'tourGo' && tourGo(data.position);
            });

            on('$stateChangeSuccess', () => {
                if (!has()) {
                    hide();
                }
            });

            scope.$on('$destroy', unsubscribe);

            /**
             * Action with left and right arrows
             * @param  {Number} options.keyCode
             */
            const onKeydown = ({ keyCode }) => {
                keyCode === 37 && tourPrev(); // Left arrow
                keyCode === 39 && tourNext(); // Right arrow
            };

            /**
             * Bind a className by step to the directive in order to hide and display slides
             * @param  {Number} step
             */
            function switchActiveClassName(step) {
                element[0].className = element[0].className.replace(/wizardStep-\d{1}/, `wizardStep-${step}`);
            }

            element.on('keydown', onKeydown);

            async function tourStart() {
                await $state.go('secured.inbox');
                AppModel.set('tourActive', true);
                scope.$applyAsync(() => {
                    scope.tourActive = true; // used for body class and CSS.
                    show(); // Display the wizard
                    $timeout(() => element[0].focus(), 0, false); // Prevent $digest
                });

                tourGo(1);
            }

            function tourEnd() {
                hide(); // Hide the wizard
                AppModel.set('tourActive', false);
                scope.$applyAsync(() => {
                    scope.tourActive = false;
                    wizardBuilder.hideTooltips();
                    $('.tooltip').removeClass('tour');
                });
            }

            function tourNext() {
                if (scope.tourStep !== 4) {
                    tourGo(Number(scope.tourStep + 1));
                }
            }

            function tourPrev() {
                if (scope.tourStep > 1) {
                    tourGo(Number(scope.tourStep - 1));
                }
            }

            function tourGo(step) {
                wizardBuilder.destroyTooltips();

                scope.$applyAsync(() => {
                    scope.tourStep = step;
                    wizardBuilder.renderTooltips(step);
                    switchActiveClassName(step);
                });
            }
        }
    };
}
export default wizard;
