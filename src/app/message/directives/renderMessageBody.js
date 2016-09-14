angular.module('proton.message')
    .directive('renderMessageBody', (networkActivityTracker) => ({
        link(scope, el) {

            const watcherKey = `message.${scope.message.getDecryptedBodyKey()}`;

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
            let unsubscribe = scope
                .$watch(watcherKey, () => {
                    scope
                        .$applyAsync(() => {
                            el[0].innerHTML = scope.message.getDecryptedBody(true);
                        });
                });

            scope
                .$on('$destroy', () => {
                    el[0].removeEventListener('animationstart', onAnimationStart, false);
                    unsubscribe();
                });

        }
    }));