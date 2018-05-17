/* @ngInject */
function actionCompose(dispatchers) {
    return {
        scope: {
            model: '=actionCompose'
        },
        link(scope, element, { actionComposeType }) {
            const { dispatcher } = dispatchers(['addFile', 'composer.new']);

            function onClick(e) {
                e.preventDefault();

                if (/addFile|addEmbedded/.test(actionComposeType)) {
                    return dispatcher.addFile('', {
                        asEmbedded: actionComposeType === 'addEmbedded',
                        message: scope.model
                    });
                }

                return dispatcher['composer.new'](actionComposeType, {
                    message: scope.model
                });
            }

            element[0].addEventListener('click', onClick);

            scope.$on('$destroy', () => {
                element[0].removeEventListener('click', onClick);
            });
        }
    };
}

export default actionCompose;
