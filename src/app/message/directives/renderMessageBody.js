angular.module('proton.message')
    .directive('renderMessageBody', (networkActivityTracker, $sce) => ({
        link(scope, el) {

            const watcherKey = 'body';

            // Render the loader
            networkActivityTracker.dispatch('load');

            const onAnimationStart = ({ animationName }) => {

                /**
                 * Detect when the animation from the keyFrame nodeInserted is triggered
                 * cf messageView.css, then hide the activityTracker
                 */
                if (animationName === 'nodeInserted') {
                    networkActivityTracker.dispatch('close');
                }
            };

            el[0].addEventListener('animationstart', onAnimationStart, false);

            // Update the body after every update of the decryptedBody
            const unsubscribe = scope
                .$watch(watcherKey, () => {
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
    }));
