/* @ngInject */
function composerAskEmbedded(dispatchers, gettextCatalog) {
    const buildTitle = (node, pending) => {
        node.textContent = gettextCatalog.getPlural(
            pending,
            '{{$count}} image detected',
            '{{$count}} images detected',
            {},
            'Composer, message drag and drop images'
        );
    };

    return {
        replace: true,
        templateUrl: require('../../../templates/directives/composer/composerAskEmbedded.tpl.html'),
        link(scope, el, { action = '' }) {
            const key = ['attachment.upload', action].filter(Boolean).join('.');
            const { dispatcher, on, unsubscribe } = dispatchers([key]);
            const dispatch = (data) => dispatcher[key]('upload', data);

            const $title = el[0].querySelector('.composerAskEmbdded-title');

            on(key, (e, { type, data }) => {
                if (type === 'drop') {
                    // Compute how many upload do we have and render it
                    buildTitle($title, data.queue.files.filter(({ isEmbedded }) => isEmbedded).length);
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

            scope.$on('$destroy', () => {
                el.off('click', onClick);
                unsubscribe();
            });
        }
    };
}
export default composerAskEmbedded;
