import _ from 'lodash';
import { flow, filter, each } from 'lodash/fp';

import { isMac } from '../../../helpers/browser';
import { SAVE_TIMEOUT_TIME } from '../../constants';

/* @ngInject */
function editorListener(
    signatureBuilder,
    embedded,
    attachmentFileFormat,
    squireExecAction,
    dispatchers,
    editorDropzone,
    removeInlineWatcher,
    mailSettingsModel,
    $state
) {
    const testMac = isMac();

    // Delay before updating the model as the process is slow
    const TIMEOUTAPP = 300;

    /**
     * Check if this squire instance is for a message or not
     * Ex: you can work with a string instead of the message model
     *   => signature
     * @return {Boolean}
     */
    const isMessage = (typeContent) => typeContent === 'message';

    /**
     * Check if the current action is coming from the current editing message
     * Both ID are undefined on outside
     * @param  {String} options.ID
     * @param  {Object} options.message
     * @param  {String} messageID
     * @return {Boolean}
     */
    const isSameMessage = ({ ID }, { message = {}, messageID }) => {
        return ID === message.ID || ID === messageID;
    };

    /**
     * Attach some hotkeys for the editor
     * @param {Dispatcher} dispatcher
     * @param {Squire} editor
     * @param {jQLite} element
     * @param {Message} message
     * @return {void}
     */
    const bindHotKeys = (dispatcher, editor, element, message) => {
        /**
         * Higher order function that calls cb if `Hotkeys` is enabled in settings.
         * @param {Function} cb to call
         * @returns {Function}
         */
        const hotkeysEnabled = (cb) => {
            /**
             * Function expecting the `setKeyHandler` arguments from Squire.
             * @param {Squire} self Squire instance
             * @param {Event} event DOM event
             */
            return (self, event) => {
                const { Hotkeys } = mailSettingsModel.get();
                Hotkeys === 1 && cb(self, event);
            };
        };

        editor.setKeyHandler(
            'escape',
            hotkeysEnabled(() => {
                dispatcher['composer.update']('close.message', { message, save: true });
            })
        );

        const sendKey = `${testMac ? 'meta' : 'ctrl'}-enter`;

        editor.setKeyHandler(
            sendKey,
            hotkeysEnabled((self, event) => {
                event.preventDefault();
                dispatcher.editorListener('pre.send.message', { message });
            })
        );

        const linkKey = `${testMac ? 'meta' : 'ctrl'}-k`;

        editor.setKeyHandler(
            linkKey,
            hotkeysEnabled((self, event) => {
                event.preventDefault();
                dispatcher['squire.editor']('squireActions', { action: 'makeLink', message });
            })
        );
    };

    /**
     * Generate an event listener based on the eventName
     * Debounce some events are they are triggered too many times
     * Dispatch an event editor.draggable
     * @param {Dispatcher} dispatcher
     * @param {String} type void
     * @param {Message} message
     * @param {String} typeContent
     * @return {Function} EventListener Callback
     */
    const draggableCallback = (dispatcher, type, message, typeContent) => {
        if (typeContent !== 'message') {
            return angular.noop;
        }

        const isEnd = type === 'dragleave' || type === 'drop';
        const cb = (event) => {
            dispatcher['editor.draggable'](type, {
                messageID: message.ID,
                message,
                event
            });
        };
        return isEnd ? _.debounce(cb, 500) : cb;
    };

    /**
     * Listener for attachments inside the composer
     *     - Detect how and when we need to add or remove them
     * @param {Function} on
     * @param {Squire} editor
     * @param {String} action
     * @param {Message} message
     * @return {Function} Unsubscribe
     */
    const listenerAttachment = (on, editor, action, message) => {
        const key = ['attachment.upload', action].filter(Boolean).join('.');

        on(key, (e, { type, data }) => {
            if (!isSameMessage(message, data)) {
                return;
            }

            if (message.MIMEType === 'plain/text') {
                return;
            }

            switch (type) {
                case 'upload.success':
                    flow(
                        filter(({ attachment = {} }) => attachment.Headers['content-disposition'] === 'inline'),
                        each(({ cid, url, attachment }) => {
                            // If we close the composer the editor won't exist anymore but maybe we were uploading an attachment
                            editor.fireEvent('refresh', {
                                action: 'attachment.embedded',
                                data: { url, cid, attachment }
                            });
                        })
                    )(data.upload);
                    break;

                case 'remove.embedded':
                    editor.fireEvent('refresh', {
                        action: 'attachment.remove',
                        data: data.attachment.Headers
                    });
                    break;
            }
        });
    };

    const listenerSaveMessage = (dispatcher, editor, message) => {
        let isEditorFocused = false;
        const onFocus = () => (isEditorFocused = true);
        const onBlur = () => (isEditorFocused = false);
        const onInput = _.debounce(() => {
            isEditorFocused && dispatcher['squire.editor']('input', { message });
        }, SAVE_TIMEOUT_TIME);

        // proxy for autosave as Mousetrap doesn't work with iframe
        const onKeyDown = (e) => {
            // Check alt too cf Polish keyboard for S #5476
            if (!e.altKey && (e.ctrlKey || e.metaKey) && e.keyCode === 83) {
                e.preventDefault();
                Mousetrap.trigger('mod+s');
            }
        };

        editor.addEventListener('input', onInput);
        editor.addEventListener('blur', onBlur);
        editor.addEventListener('focus', onFocus);
        // eslint-disable-next-line no-underscore-dangle
        editor._doc.addEventListener('keydown', onKeyDown);

        return () => {
            editor.removeEventListener('input', onInput);
            editor.removeEventListener('blur', onBlur);
            editor.removeEventListener('focus', onFocus);
        };
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
    return (scope, el, { typeContent, action }) => {
        // For a type !== message vodoo magic "realtime"
        const timeout = typeContent === 'message' ? TIMEOUTAPP : 32;

        return (updateModel, editor) => {
            const message = scope.message;
            const unsubscribe = [];
            const { dispatcher, on, unsubscribe: unsubscribeRootScope } = dispatchers([
                'composer.update',
                'squire.editor',
                'editor.draggable',
                'editorListener'
            ]);

            // Custom dropzone to insert content into the editor if it's not a composer
            if (!isMessage(typeContent)) {
                unsubscribe.push(editorDropzone(el, message, editor));
            }

            // Watcher to detect when the user remove an embedded image
            if (isMessage(typeContent)) {
                listenerAttachment(on, editor, action, message);

                const watcherEmbedded = removeInlineWatcher(action);
                const onRemoveEmbedded = _.throttle(() => watcherEmbedded(message, editor), 300);

                // Check if we need to remove embedded after a delay
                editor.addEventListener('input', onRemoveEmbedded);
                unsubscribe.push(() => editor.removeEventListener('input', onRemoveEmbedded));

                if (!$state.is('eo.reply')) {
                    unsubscribe.push(listenerSaveMessage(dispatcher, editor, message));
                }

                /**
                 * Important to wait until updateModel has finished before sending or saving a message.
                 */
                on('editorListener', async (event, { type, data }) => {
                    if (!isSameMessage(message, data)) {
                        return;
                    }
                    switch (type) {
                        case 'pre.send.message': {
                            editor.disableInput();
                            await updateModel(editor.getHTML());
                            dispatcher['composer.update']('send.message', { message });
                            break;
                        }
                        case 'send.failed': {
                            editor.enableInput();
                            break;
                        }
                        case 'pre.save.message': {
                            await updateModel(editor.getHTML());
                            dispatcher['composer.update']('save.message', { message });
                            break;
                        }
                    }
                });
            }

            ['dragleave', 'dragenter', 'drop'].forEach((key) => {
                const cb = draggableCallback(dispatcher, key, message, typeContent);
                editor.addEventListener(key, cb);
                unsubscribe.push(() => editor.removeEventListener(key, cb));
            });

            // Only update the model every 300ms or at least 2 times before saving a draft
            const onInput = _.throttle(() => updateModel(editor.getHTML()), timeout);
            const onBlur = () => el.removeClass('focus').triggerHandler('blur');
            const onMsctrlSelect = (event) => event.preventDefault();

            const onRefresh = ({ Body = '', action = '', data } = {}) => {
                if (action === 'attachment.remove') {
                    embedded.removeEmbedded(message, data, editor.getHTML());
                }

                if (action === 'attachment.embedded') {
                    return squireExecAction.insertImage(message, {
                        url: data.url,
                        opt: {
                            'data-embedded-img': data.cid,
                            alt: data.attachment.Name
                        }
                    });
                }

                if (action === 'message.changeFrom') {
                    const html = signatureBuilder.update(message, editor.getHTML());
                    !message.isPlainText() && editor.setHTML(html);
                    return updateModel(html, true, true);
                }

                if (isMessage(typeContent)) {
                    // Replace the embedded images with CID to keep the model updated
                    return embedded
                        .parser(message)
                        .then((body) => (editor.setHTML(body), body))
                        .then(updateModel);
                }

                editor.setHTML(Body);
                updateModel(Body);
            };

            const onFocus = () => {
                el.addClass('focus').triggerHandler('focus');
                dispatcher['composer.update']('editor.focus', {
                    editor,
                    element: el,
                    message,
                    isMessage: isMessage(typeContent)
                });
            };

            const onDrop = (e) => {
                // Do not prevent the drop of text
                attachmentFileFormat.isUploadAbleType(e) && e.preventDefault();
                const file = e.dataTransfer.files[0];
                if (file && /image/.test(file.type || '')) {
                    // Prevent the default insert action from happening, since we are handling it (issue on edge (#6600).
                    e.preventDefault();
                    squireExecAction.insertImage(message, { url: '', file });
                }
            };

            bindHotKeys(dispatcher, editor, el, message);

            editor.addEventListener('drop', onDrop);
            editor.addEventListener('input', onInput);
            editor.addEventListener('refresh', onRefresh);
            editor.addEventListener('focus', onFocus);
            editor.addEventListener('blur', onBlur);
            editor.addEventListener('mscontrolselect', onMsctrlSelect);

            // Unsubscribe
            return () => {
                unsubscribe.forEach((cb) => cb());
                unsubscribe.length = 0;
                unsubscribeRootScope();

                editor.removeEventListener('drop', onDrop);
                editor.removeEventListener('input', onInput);
                editor.removeEventListener('refresh', onRefresh);
                editor.removeEventListener('focus', onFocus);
                editor.removeEventListener('blur', onBlur);
                editor.removeEventListener('mscontrolselect', onMsctrlSelect);
            };
        };
    };
}
export default editorListener;
