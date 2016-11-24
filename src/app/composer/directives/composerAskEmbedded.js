angular.module('proton.composer')
    .directive('composerAskEmbedded', ($rootScope) => {


        const buildTitle = (node, pending) => node.textContent = `${pending} images detected`;

        return {
            replace: true,
            templateUrl: 'templates/directives/composer/composerAskEmbedded.tpl.html',
            link(scope, el, { action = '' }) {

                const key = ['attachment.upload', action].filter(Boolean).join('.');
                const dispatch = (data) => $rootScope.$emit(key, { type: 'upload', data });

                const $title = el[0].querySelector('.composerAskEmbdded-title');

                const unsubscribe = $rootScope.$on(key, (e, { type, data }) => {
                    if (type === 'drop') {
                        // Compute how many upload do we have and render it
                        buildTitle($title, data.queue.files.length);
                    }
                });


                /**
                 * Trigger an action onclick
                 *     For cancel button, as the composant is displayed by
                 *     the composer itself, it's closed by the composer
                 * @param  {Node} options.target
                 * @return {void}
                 */
                const onClick = ({ target }) => {
                    if (target.nodeName === 'BUTTON') {
                        dispatch({
                            messageID: scope.message.ID,
                            message: scope.message,
                            action: target.getAttribute('data-action')
                        });
                    }
                };

                el.on('click', onClick);

                scope
                    .$on('$destroy', () => {
                        el.off('click', onClick);
                        unsubscribe();
                    });
            }
        };
    });
