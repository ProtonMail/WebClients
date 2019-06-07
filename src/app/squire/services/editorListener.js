/* eslint no-underscore-dangle: "off" */
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
    hotkeys,
    $state,
    pasteImage
) {
    const testMac = isMac();

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
     * @param {Message} message
     * @param {String} typeContent
     * @return {void}
     */
    const bindHotKeys = (dispatcher, editor, message, typeContent) => {
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
                isMessage(typeContent) && dispatcher.editorListener('pre.close.message', { message });
            })
        );

        const sendKey = `${testMac ? 'meta' : 'ctrl'}-enter`;

        editor.setKeyHandler(
            sendKey,
            hotkeysEnabled((self, event) => {
                if (isMessage(typeContent)) {
                    event.preventDefault();
                    dispatcher.editorListener('pre.send.message', { message });
                }
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

    // proxy for autosave as Mousetrap doesn't work with iframe
    const onKeyDown = (e) => {
        // Check alt too cf Polish keyboard for S #5476
        if (!e.altKey && (e.ctrlKey || e.metaKey) && e.keyCode === 83) {
            e.preventDefault();
            hotkeys.trigger('mod+s');
        }
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

                // For a type !== message vodoo magic "realtime"
                const onInput = _.debounce(() => updateModel(editor.getHTML()), 32);
                editor.addEventListener('input', onInput);
                unsubscribe.push(() => {
                    onInput.cancel();
                    editor.removeEventListener('input', onInput);
                });
            }

            // Watcher to detect when the user remove an embedded image
            if (isMessage(typeContent)) {
                listenerAttachment(on, editor, action, message);

                const watcherEmbedded = removeInlineWatcher(action);
                const onRemoveEmbedded = _.throttle(() => watcherEmbedded(message, editor), 300);

                // Check if we need to remove embedded after a delay
                editor.addEventListener('input', onRemoveEmbedded);
                unsubscribe.push(() => editor.removeEventListener('input', onRemoveEmbedded));

                /**
                 * Important to wait until updateModel has finished before sending or saving a message.
                 */
                on('editorListener', async (event, { type, data }) => {
                    if (!isSameMessage(message, data)) {
                        return;
                    }
                    switch (type) {
                        case 'pre.close.message': {
                            await updateModel(editor.getHTML());
                            dispatcher['composer.update']('close.message', { message, save: true });
                            break;
                        }
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

                editor._doc.addEventListener('keydown', onKeyDown);
                unsubscribe.push(() => editor._doc.removeEventListener('keydown', onKeyDown));
                const onInput = _.debounce(async () => {
                    await updateModel(editor.getHTML());
                    dispatcher['composer.update']('autosave.message', { message });
                }, SAVE_TIMEOUT_TIME);

                editor.addEventListener('input', onInput);
                unsubscribe.push(() => {
                    // Cancel the debounced function so that it's not called after the composer is closed.
                    onInput.cancel();
                    editor.removeEventListener('input', onInput);
                });
            }

            ['dragleave', 'dragenter', 'drop'].forEach((key) => {
                const cb = draggableCallback(dispatcher, key, message, typeContent);
                editor.addEventListener(key, cb);
                unsubscribe.push(() => editor.removeEventListener(key, cb));
            });

            const onBlur = () => el.removeClass('focus').triggerHandler('blur');
            const onMsctrlSelect = (event) => event.preventDefault();

            const onRefresh = ({ action = '', data } = {}) => {
                if (action === 'attachment.remove') {
                    const html = embedded.removeEmbedded(message, data, editor.getHTML());
                    editor.setHTML(html);
                    return updateModel(html);
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

                if (action === 'signature.update') {
                    editor.setHTML(data);
                    return updateModel(data);
                }
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

            const onPaste = pasteImage(message);
            const onPasteImage = pasteImage(message, 'paste.image');

            bindHotKeys(dispatcher, editor, message, typeContent);

            editor.addEventListener('paste', onPaste);
            editor.addEventListener('paste.image', onPasteImage);
            editor.addEventListener('drop', onDrop);
            editor.addEventListener('refresh', onRefresh);
            editor.addEventListener('focus', onFocus);
            editor.addEventListener('blur', onBlur);
            editor.addEventListener('mscontrolselect', onMsctrlSelect);

            // Unsubscribe
            return () => {
                unsubscribe.forEach((cb) => cb());
                unsubscribe.length = 0;
                unsubscribeRootScope();
                editor.removeEventListener('paste', onPaste);
                editor.removeEventListener('paste.image', onPasteImage);
                editor.removeEventListener('drop', onDrop);
                editor.removeEventListener('refresh', onRefresh);
                editor.removeEventListener('focus', onFocus);
                editor.removeEventListener('blur', onBlur);
                editor.removeEventListener('mscontrolselect', onMsctrlSelect);
            };
        };
    };
}
export default editorListener;
