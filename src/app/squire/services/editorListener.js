angular.module('proton.squire')
    .factory('editorListener', (signatureBuilder, embedded, attachmentFileFormat, squireExecAction, $rootScope, authentication, editorDropzone, removeInlineWatcher) => {

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

        // /**
        //  * Watcher onInput to find and remove attachements if we remove an embedded
        //  * image from the input
        //  * @return {Function} Taking message as param
        //  */
        // function removerEmbeddedWatcher(action) {
        //     let latestCids = [];
        //     const key = ['attachment.upload', action].filter(Boolean).join('.');

        //     return (message, editor) => {
        //         const input = editor.getHTML() || '';

        //         // Extract CID per embedded image
        //         const cids = (input.match(/(rel=("([^"]|"")*"))|(data-embedded-img=("([^"]|"")*"))/g) || [])
        //             .map((value) => value.split(/rel="|data-embedded-img="/)[1].slice(0, -1));

        //         // If we add or remove an embedded image, the diff is true
        //         if (cids.length < latestCids.length) {
        //             // Find attachements not in da input
        //             const AttToRemove = message
        //                 .Attachments
        //                 .filter(({ uploading, Headers = {} }) => {

        //                     // If the file is uploading it means: its first time
        //                     if (uploading) {
        //                         return false;
        //                     }

        //                     const cid = Headers['content-id'];
        //                     if (cid) {
        //                         return cids.indexOf(cid.replace(/[<>]+/g, '')) === -1;
        //                     }

        //                     return false;

        //                 });

        //         }
        //         $rootScope.$emit(key, {
        //             type: 'remove.all',
        //             data: {
        //                 message,
        //                 list: AttToRemove
        //             }
        //         });

        //         latestCids = cids;
        //     };
        // }

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
        return (scope, el, { typeContent, action }) => {

            // For a type !== message vodoo magic "realtime"
            const timeout = (typeContent === 'message') ? TIMEOUTAPP : 32;


            return (updateModel, editor) => {

                let unsubscribe = angular.noop;
                let onRemoveEmbedded = angular.noop;

                // Custom dropzone to insert content into the editor if it's not a composer
                if (!isMessage(typeContent)) {
                    unsubscribe = editorDropzone(el, scope.message, editor);
                }

                // Watcher to detect when the user remove an embedded image
                if (isMessage(typeContent)) {
                    const watcherEmbedded = removeInlineWatcher(action);
                    onRemoveEmbedded = _.throttle(() => watcherEmbedded(scope.message, editor), 300);
                    // Check if we need to remove embedded after a delay
                    editor.addEventListener('input', onRemoveEmbedded);
                }

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
                    unsubscribe();
                    editor.removeEventListener('drop', onDrop);
                    editor.removeEventListener('input', onInput);
                    editor.removeEventListener('refresh', onRefresh);
                    editor.removeEventListener('focus', onFocus);
                    editor.removeEventListener('blur', onBlur);
                    editor.removeEventListener('mscontrolselect', onMsctrlSelect);
                    editor.removeEventListener('input', onRemoveEmbedded);
                };
            };

        };
    });
