angular.module('proton.squire')
    .directive('squire', (squireEditor, embedded, editorListener, $rootScope, sanitize, toggleModeEditor, AppModel) => {

        const CLASS_NAMES = {
            LOADED: 'squireEditor-loaded'
        };

        /**
         * Check if this squire instance is for a message or not
         * Ex: you can work with a string intead of the message model
         *   => signature
         * @return {Boolean}
         */
        const isMessage = (typeContent) => typeContent === 'message';

        /*
            We need the editor to get a valid plain text message on Load
            - Parse a new message
            - Don't parse when we open a draft already created.
         */
        const loadPlainText = (scope, editor) => () => {

            const isPlainTextMode = AppModel.get('editorMode') === 'text/plain';
            const isDraftPlainText = scope.message.isPlainText() && scope.message.IsEncrypted === 5;
            const isNewDraft = !scope.message.isPlainText() || !scope.message.IsEncrypted;

            if ((isPlainTextMode && isNewDraft) || isDraftPlainText) {
                toggleModeEditor.toPlainText(scope.message, editor);
            }
        };

        return {
            scope: {
                message: '=?', // body
                value: '=?', // body
                allowEmbedded: '=',
                allowDataUri: '='
            },
            replace: true,
            templateUrl: 'templates/directives/squire.tpl.html',
            link(scope, el, { typeContent = 'message', action = '', id }) {

                scope.data = {};
                if (!isMessage(typeContent)) {
                    scope.message = { ID: id, isPlainText: _.noop };
                }

                const listen = editorListener(scope, el, { typeContent, action });

                function updateModel(val, dispatchAction = false) {

                    if (scope.message.MIMEType === 'text/plain') {
                        // disable all updates.
                        return;
                    }

                    const value = sanitize.input(val || '');
                    scope.$applyAsync(() => {

                        if (scope.message.MIMEType === 'text/plain') {
                            // disable all updates.
                            return;
                        }

                        const isEmpty = !value.trim().length;
                        el[`${isEmpty ? 'remove' : 'add'}Class`]('squire-has-value');

                        if (isMessage(typeContent)) {
                        // Replace the embedded images with CID to keep the model updated
                            return embedded.parser(scope.message, { direction: 'cid', text: value })
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

                squireEditor.create(el.find('iframe.squireIframe'), scope.message, typeContent)
                    .then(onLoadEditor);

                function onLoadEditor(editor) {

                    let unsubscribe = angular.noop;

                    const isLoaded = () => {
                        el[0].classList.add(CLASS_NAMES.LOADED);
                        scope.$applyAsync(() => scope.isLoaded = true);
                    };

                    if (isMessage(typeContent)) {
                        // On load we parse the body of the message in order to load its embedded images
                        embedded.parser(scope.message)
                            .then((body) => editor.setHTML(body))
                            .then(loadPlainText(scope, editor))
                            .then(isLoaded)
                            .then(() => unsubscribe = listen(updateModel, editor));
                    } else {
                        editor.setHTML(scope.value || '');

                        // defer loading to prevent input event refresh (takes some time to perform the setHTML)
                        const id = setTimeout(() => {
                            unsubscribe = listen(updateModel, editor);
                            isLoaded();
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
                        squireEditor.clean(scope.message);
                        editor.destroy();
                    });
                }

            }
        };
    });
