angular.module('proton.squire')
.directive('squire', (squireEditor, embedded, editorListener, $rootScope) => {

    /**
     * Check if this squire instance is for a message or not
     * Ex: you can work with a string intead of the message model
     *   => signature
     * @return {Boolean}
     */
    const isMessage = (typeContent) => typeContent === 'message';

    return {
        scope: {
            message: '=', // body
            value: '=?', // body
            allowEmbedded: '=',
            allowDataUri: '='
        },
        replace: true,
        transclude: true,
        templateUrl: 'templates/directives/squire.tpl.html',
        link(scope, el, { typeContent = 'message', action = '' }) {

            scope.data = {};
            const listen = editorListener(scope, el, { typeContent, action });

            function updateModel(val, dispatchAction = false) {

                const value = DOMPurify.sanitize(val || '');
                scope.$applyAsync(() => {

                    const isEmpty = !value.trim().length;
                    el[`${isEmpty ? 'remove' : 'add'}Class`]('squire-has-value');

                    if (isMessage(typeContent)) {
                        // Replace the embedded images with CID to keep the model updated
                        return embedded
                            .parser(scope.message, 'cid', value)
                            .then((body) => {
                                scope.message.setDecryptedBody(body);

                                // Dispatch an event to update the message
                                dispatchAction && $rootScope.$emit('message.updated', {
                                    message: scope.message
                                });
                            });
                    }

                    // We can work onto a string too
                    scope.value = value;

                });
            }

            squireEditor.create(el.find('iframe.squireIframe'), scope.message)
                .then(onLoadEditor);

            function onLoadEditor(editor) {

                let unsubscribe = angular.noop;

                if (isMessage(typeContent)) {
                    // On load we parse the body of the message in order to load its embedded images
                    embedded
                        .parser(scope.message)
                        .then((body) => editor.setHTML(body))
                        .then(() => unsubscribe = listen(updateModel, editor));
                } else {
                    editor.setHTML(scope.value || '');

                    // defer loading to prevent input event refresh (takes some time to perform the setHTML)
                    const id = setTimeout(() => {
                        unsubscribe = listen(updateModel, editor);
                        clearTimeout(id);
                    }, 100);
                }

                $rootScope.$emit('composer.update', {
                    type: 'editor.loaded',
                    data: {
                        element: el, editor,
                        message: scope.message,
                        isMessage: isMessage(typeContent)
                    }
                });

                scope.$on('$destroy', () => {
                    unsubscribe();
                    editor.destroy();
                });
            }

        }
    };
});
