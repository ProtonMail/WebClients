import _ from 'lodash';
import { flow, filter, each } from 'lodash/fp';
import { isMac } from '../../../helpers/browser';
import { CONSTANTS } from '../../constants';

/* @ngInject */
function editorListener(
    signatureBuilder,
    embedded,
    attachmentFileFormat,
    squireExecAction,
    $rootScope,
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
     * @param  {Squire} editor
     * @param  {jQLite} element
     * @return {void}
     */
    const bindHotKeys = (editor, element, scope) => {
        editor.setKeyHandler('escape', () => {
            const { Hotkeys } = mailSettingsModel.get();

            if (Hotkeys === 1) {
                $rootScope.$emit('composer.update', {
                    type: 'close.message',
                    data: {
                        message: scope.message,
                        save: true
                    }
                });
            }
        });

        const sendKey = `${testMac ? 'meta' : 'ctrl'}-enter`;

        editor.setKeyHandler(sendKey, (self, event) => {
            const { Hotkeys } = mailSettingsModel.get();

            if (Hotkeys === 1) {
                event.preventDefault();
                $rootScope.$emit('composer.update', {
                    type: 'send.message',
                    data: { message: scope.message }
                });
            }
        });
    };

    /**
     * Generate an event listener based on the eventName
     * Debounce some events are they are triggered too many times
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
                    message,
                    event
                }
            });
        };
        return isEnd ? _.debounce(cb, 500) : cb;
    };

    /**
     * Listener for attachments inside the composer
     *     - Detect how and when we need to add or remove them
     * @param  {Squire} editor
     * @param  {String} action
     * @return {Function}        Unsubscribe
     */
    const listenerAttachment = (editor, action, message) => {
        const key = ['attachment.upload', action].filter(Boolean).join('.');

        return $rootScope.$on(key, (e, { type, data }) => {
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

    const listenerSaveMessage = (editor, scope) => {
        let isEditorFocused = false;
        const onFocus = () => (isEditorFocused = true);
        const onBlur = () => (isEditorFocused = false);
        const onInput = _.debounce(() => {
            isEditorFocused &&
                $rootScope.$emit('squire.editor', {
                    type: 'input',
                    data: { message: scope.message }
                });
        }, CONSTANTS.SAVE_TIMEOUT_TIME);

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
            let unsubscribe = angular.noop;
            let onRemoveEmbedded = angular.noop;
            let unsubscribeAtt = angular.noop;
            let unsubscribeEditor = angular.noop;

            // Custom dropzone to insert content into the editor if it's not a composer
            if (!isMessage(typeContent)) {
                unsubscribe = editorDropzone(el, scope.message, editor);
            }

            // Watcher to detect when the user remove an embedded image
            if (isMessage(typeContent)) {
                const watcherEmbedded = removeInlineWatcher(action);
                onRemoveEmbedded = _.throttle(() => watcherEmbedded(scope.message, editor), 300);
                unsubscribeAtt = listenerAttachment(editor, action, scope.message);
                // Check if we need to remove embedded after a delay
                editor.addEventListener('input', onRemoveEmbedded);

                if (!$state.is('eo.reply')) {
                    unsubscribeEditor = listenerSaveMessage(editor, scope);
                }
            }

            ['dragleave', 'dragenter', 'drop'].forEach((key) =>
                editor.addEventListener(key, draggableCallback(key, scope.message, typeContent))
            );

            // Only update the model every 300ms or at least 2 times before saving a draft
            const onInput = _.throttle(() => updateModel(editor.getHTML()), timeout);
            const onBlur = () => el.removeClass('focus').triggerHandler('blur');
            const onMsctrlSelect = (event) => event.preventDefault();

            const onRefresh = ({ Body = '', action = '', data } = {}) => {
                if (action === 'attachment.remove') {
                    embedded.removeEmbedded(scope.message, data, editor.getHTML());
                }

                if (action === 'attachment.embedded') {
                    return squireExecAction.insertImage(scope.message, {
                        url: data.url,
                        opt: {
                            'data-embedded-img': data.cid,
                            alt: data.attachment.Name
                        }
                    });
                }

                if (action === 'message.changeFrom') {
                    const html = signatureBuilder.update(scope.message, editor.getHTML());
                    !scope.message.isPlainText() && editor.setHTML(html);
                    return updateModel(html, true, true);
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
                    // Prevent the default insert action from happening, since we are handling it (issue on edge (#6600).
                    e.preventDefault();
                    squireExecAction.insertImage(scope.message, { url: '', file });
                }
            };

            bindHotKeys(editor, el, scope);

            editor.addEventListener('drop', onDrop);
            editor.addEventListener('input', onInput);
            editor.addEventListener('refresh', onRefresh);
            editor.addEventListener('focus', onFocus);
            editor.addEventListener('blur', onBlur);
            editor.addEventListener('mscontrolselect', onMsctrlSelect);

            // Unsubscribe
            return () => {
                unsubscribe();
                unsubscribeAtt();
                unsubscribeEditor();
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
}
export default editorListener;
