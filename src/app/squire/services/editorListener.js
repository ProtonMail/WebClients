angular.module('proton.squire')
    .factory('editorListener', (signatureBuilder, embedded, attachmentFileFormat, squireExecAction, $rootScope, authentication) => {

        const isMac = navigator.userAgent.indexOf('Mac OS X') !== -1;

        // Delay before updating the model as the process is slow
        const TIMEOUTAPP = 300;

        /**
         * Check if this squire instance is for a message or not
         * Ex: you can work with a string intead of the message model
         *   => signature
         * @return {Boolean}
         */
        const isMessage = (typeContent) => typeContent === 'message';

        /**
         * Attach some hotkeus for the editor
         * @param  {Squire} editor
         * @param  {jQLite} element
         * @return {void}
         */
        const bindHotKeys = (editor, element) => {

            editor.setKeyHandler('escape', () => {
                if (authentication.user.Hotkeys === 1) {
                    $rootScope.$broadcast('closeMessage', element);
                }
            });

            const sendKey = `${isMac ? 'meta' : 'ctrl'}-enter`;
            editor.setKeyHandler(sendKey, (self, event) => {
                if (authentication.user.Hotkeys === 1) {
                    event.preventDefault();
                    $rootScope.$broadcast('sendMessage', element);
                }
            });

        };

        /**
         * Generate an event listener based on the eventName
         * Debounce some events are thez are triggered too many times
         * Dispatch an event editor.draggable
         * @param  {String} type void
         * @return {Function}      EventListener Callback
         */
        const draggableCallback = (type, message, typeContent) => {

            if (typeContent !== 'message') {
                return angular.noop;
            }

            const isEnd = type === 'dragleave' || type === 'drop';
            const cb = (event) => {
                $rootScope.$emit('editor.draggable', {
                    type,
                    data: {
                        messageID: message.ID,
                        message, event
                    }
                });
            };
            return isEnd ? _.debounce(cb, 500) : cb;
        };

        /**
         * Bind events to the current editor based on
         *     - Current state
         *     - Current type of editor
         *     - Current node
         * @param  {$scope} scope
         * @param  {jQLite} el
         * @param  {String} typeContent
         * @return {Function}             Bind events
         */
        return (scope, el, typeContent) => {

            // For a type !== message vodoo magic "realtime"
            const timeout = (typeContent === 'message') ? TIMEOUTAPP : 32;

            return (updateModel, editor) => {

                ['dragleave', 'dragenter', 'drop']
                    .forEach((key) => editor.addEventListener(key, draggableCallback(key, scope.message, typeContent)));


                // Only update the model every 300ms or at least 2 times before saving a draft
                const onInput = _.throttle(() => updateModel(editor.getHTML()), timeout);
                const onBlur = () => el.removeClass('focus').triggerHandler('blur');
                const onMsctrlSelect = (event) => event.preventDefault();

                const onRefresh = ({ Body = '', action = '', data } = {}) => {

                    if (action === 'attachment.remove') {
                        embedded.removeEmbedded(scope.message, data, editor.getHTML());
                    }

                    if (action === 'attachment.embedded') {
                        return editor
                            .insertImage(data.url, {
                                'data-embedded-img': data.cid,
                                class: 'proton-embedded'
                            });
                    }

                    if (action === 'message.changeFrom') {
                        const html = signatureBuilder.update(scope.message, editor.getHTML());
                        editor.setHTML(html);
                        return updateModel(html, true);
                    }

                    if (isMessage(typeContent)) {
                        // Replace the embedded images with CID to keep the model updated
                        return embedded
                            .parser(scope.message)
                            .then((body) => (editor.setHTML(body), body))
                            .then(updateModel);
                    }

                    editor.setHTML(Body);
                    updateModel(Body);
                };

                const onFocus = () => {
                    el.addClass('focus').triggerHandler('focus');
                    $rootScope.$emit('composer.update', {
                        type: 'editor.focus',
                        data: {
                            editor,
                            element: el,
                            message: scope.message,
                            isMessage: isMessage(typeContent)
                        }
                    });
                };

                const onDrop = (e) => {
                    // Do not prevent the drop of text
                    attachmentFileFormat.isUploadAbleType(e) && e.preventDefault();
                    const file = e.dataTransfer.files[0];
                    if (file && /image/.test(file.type || '')) {
                        squireExecAction.insertImage(scope.message, '', file);
                    }
                };

                bindHotKeys(editor, el);

                editor.addEventListener('drop', onDrop);
                editor.addEventListener('input', onInput);
                editor.addEventListener('refresh', onRefresh);
                editor.addEventListener('focus', onFocus);
                editor.addEventListener('blur', onBlur);
                editor.addEventListener('mscontrolselect', onMsctrlSelect);

                // Unsubscribe
                return () => {
                    editor.addEventListener('drop', onDrop);
                    editor.addEventListener('input', onInput);
                    editor.addEventListener('refresh', onRefresh);
                    editor.addEventListener('focus', onFocus);
                    editor.addEventListener('blur', onBlur);
                    editor.addEventListener('mscontrolselect', onMsctrlSelect);
                };
            };

        };
    });
