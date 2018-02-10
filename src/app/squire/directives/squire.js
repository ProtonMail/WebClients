import _ from 'lodash';

/* @ngInject */
function squire(squireEditor, embedded, editorListener, $rootScope, sanitize, toggleModeEditor, mailSettingsModel, onCurrentMessage) {
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

    /**
     * Disable focus via TAB key when we switch are in mode: plaintext
     * @param  {Node} iframe
     * @return {Function}         arg:<Boolean> isPlaintext
     */
    const tabIndexAble = (iframe) => (isPlainText) => {
        isPlainText && iframe.setAttribute('tabindex', '-1');
        !isPlainText && iframe.removeAttribute('tabindex');
    };

    /*
        We need the editor to get a valid plain text message on Load
        - Parse a new message
        - Don't parse when we open a draft already created.
     */
    const loadPlainText = (scope, editor, bindTabIndex = _.noop) => () => {
        const isPlainTextMode = scope.message.MIMEType === 'text/plain';
        const isDraftPlainText = scope.message.isPlainText() && scope.message.IsEncrypted === 5;
        const isNewDraft = !scope.message.isPlainText() || !scope.message.IsEncrypted;

        bindTabIndex(isPlainTextMode);

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
        templateUrl: require('../../../templates/directives/squire.tpl.html'),
        link(scope, el, { typeContent = 'message', action = '', id }) {
            scope.data = {};
            const $iframe = el.find('iframe.squireIframe');
            $iframe[0].id = `${id}${Date.now()}`;

            if (!isMessage(typeContent)) {
                scope.message = { ID: id, isPlainText: _.noop };
            }

            const listen = editorListener(scope, el, { typeContent, action });

            function updateModel(val, dispatchAction = false) {
                const value = sanitize.input(val || '');
                scope.$applyAsync(() => {
                    if (scope.message.MIMEType === 'text/plain') {
                        return scope.message.setDecryptedBody(val, false);
                    }

                    const isEmpty = !value.trim().length;
                    el[0].classList[`${isEmpty ? 'remove' : 'add'}`]('squire-has-value');

                    if (isMessage(typeContent)) {
                        // Replace the embedded images with CID to keep the model updated
                        return embedded.parser(scope.message, { direction: 'cid', text: value }).then((body) => {
                            scope.message.setDecryptedBody(body);

                            // Dispatch an event to update the message
                            dispatchAction &&
                                $rootScope.$emit('message.updated', {
                                    message: scope.message
                                });
                        });
                    }

                    // We can work onto a string too
                    scope.value = value;
                });
            }

            squireEditor.create($iframe, scope.message, typeContent).then(onLoadEditor);

            function onLoadEditor(editor) {
                const unsubscribe = [];
                const bindTabIndex = tabIndexAble($iframe[0]);

                // Prevent tab focus when we switch to plaintext
                unsubscribe.push(
                    onCurrentMessage('squire.editor', scope, (type, { action, argument } = {}) => {
                        if (type === 'squireActions' && action === 'setEditorMode' && action) {
                            bindTabIndex(argument.value === 'text/plain');
                        }
                    })
                );

                const isLoaded = () => {
                    el[0].classList.add(CLASS_NAMES.LOADED);
                    scope.$applyAsync(() => (scope.isLoaded = true));
                };

                if (isMessage(typeContent)) {
                    // On load we parse the body of the message in order to load its embedded images
                    embedded
                        .parser(scope.message)
                        .then((body) => {
                            editor.setHTML(body);
                            if (scope.message.RightToLeft) {
                                editor.setTextDirectionWithoutFocus('rtl');
                            }
                        })
                        .then(loadPlainText(scope, editor, bindTabIndex))
                        .then(isLoaded)
                        .then(() => unsubscribe.push(listen(updateModel, editor)));
                } else {
                    editor.setHTML(scope.value || '');

                    // defer loading to prevent input event refresh (takes some time to perform the setHTML)
                    const id = setTimeout(() => {
                        unsubscribe.push(listen(updateModel, editor));
                        isLoaded();
                        clearTimeout(id);
                    }, 100);
                }

                $rootScope.$emit('composer.update', {
                    type: 'editor.loaded',
                    data: {
                        element: el,
                        editor,
                        message: scope.message,
                        isMessage: isMessage(typeContent)
                    }
                });

                scope.$on('$destroy', () => {
                    unsubscribe.forEach((cb) => cb());
                    unsubscribe.length = 0;
                    squireEditor.clean(scope.message);
                    toggleModeEditor.clear(scope.message);
                    editor.destroy();
                });
            }
        }
    };
}
export default squire;
