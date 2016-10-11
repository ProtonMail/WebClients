angular.module('proton.message')
    .directive('renderMessageBody', (networkActivityTracker, $sce) => {

        /**
         * Dispatch an action to render the loader only if
         *     - the body is empty
         *     - the body is big
         * @param  {String} body
         * @param  {String} action
         * @return {void}
         */
        const dispatch = (body = '', action = 'load') => {

            switch (action) {
                case 'load':
                    (body.length > 10000 || !body) && networkActivityTracker.dispatch('load');
                    break;
                default:
                    networkActivityTracker.dispatch('close');
                    break;
            }
        };

        return {
            link(scope, el) {


                // Render the loader
                dispatch(scope.body);

                const onAnimationStart = ({ animationName }) => {

                    /**
                     * Detect when the animation from the keyFrame nodeInserted is triggered
                     * cf messageView.css, then hide the activityTracker
                     */
                    if (animationName === 'nodeInserted') {
                        dispatch(scope.body, 'close');
                    }
                };

                el[0].addEventListener('animationstart', onAnimationStart, false);

                // Update the body after every update of the decryptedBody
                const unsubscribe = scope
                    .$watch('body', () => {
                        scope
                            .$applyAsync(() => {
                                el[0].innerHTML = $sce.getTrustedHtml($sce.trustAsHtml(scope.body));
                            });
                    });

                scope
                    .$on('$destroy', () => {
                        el[0].removeEventListener('animationstart', onAnimationStart, false);
                        unsubscribe();
                        // Close the loader
                        networkActivityTracker.dispatch('close');
                    });

            }
        };
    });
