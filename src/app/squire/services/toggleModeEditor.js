import _ from 'lodash';
import htmlToTextMail from '../helpers/htmlToTextMail';

/* @ngInject */
function toggleModeEditor($rootScope, dispatchers, embeddedUtils, attachmentModel, editorModel, textToHtmlMail) {
    const { on, dispatcher } = dispatchers(['squire.toggleMode', 'attachment.upload']);

    const MODE = {
        PLAINTEXT: 'text/plain',
        DEFAULT: 'text/html'
    };

    const CACHE = {
        /*
         * Holds the current state describing whether a message is allowed to toggle
         * between plaintext and html mode. We block some message from toggling when
         * we are still removing inline attachments or uploading inline attachments
         * Otherwise this would trigger the being inserted in the plaintext message,
         * which is something we don't want.
         */
        CAN_TOGGLE: {},
        /*
         * To keep track of the attachment that we are removing when switching from html to plaintext
         */
        ATTACHMENTS_PROCESSING: {}
    };

    const dispatch = (type, message) => dispatcher['squire.toggleMode'](type, { message });

    const isUploadingInline = (message) => {
        return (
            message.uploading &&
            !!attachmentModel.getCurrentQueue(message) &&
            attachmentModel.getCurrentQueue(message).files.some(({ file }) => file.inline)
        );
    };

    const hasInlineAttachments = (message) => message.Attachments.some(embeddedUtils.isEmbedded);

    const canToggle = (message) => {
        return (
            !isUploadingInline(message) &&
            (message.MIMEType !== MODE.PLAINTEXT || !hasInlineAttachments(message)) &&
            !_.keys(CACHE.ATTACHMENTS_PROCESSING[message.ID]).length
        );
    };

    on('attachment.upload', (event, { type, data }) => {
        if ((type === 'remove.success' || type === 'remove.error') && CACHE.ATTACHMENTS_PROCESSING[data.message.ID]) {
            delete CACHE.ATTACHMENTS_PROCESSING[data.message.ID][data.attachment.ID];
        }

        /*
                Note: !CACHE.CAN_TOGGLE[data.message.ID] is different from !(data.message.ID in CACHE.CAN_TOGGLE)
                Doing !(data.message.ID in CACHE.CAN_TOGGLE) instead of doing !CACHE.CAN_TOGGLE[data.message.ID]
                will make the dispatch trigger all the time when it is disabled. Because CAN_TOGGLE contains boolean values
             */
        if (data.message && (!(data.message.ID in CACHE.CAN_TOGGLE) || CACHE.CAN_TOGGLE[data.message.ID] !== canToggle(data.message))) {
            CACHE.CAN_TOGGLE[data.message.ID] = canToggle(data.message);
            dispatch(CACHE.CAN_TOGGLE[data.message.ID] ? 'enableToggle' : 'disableToggle', data.message);
        }
    });

    const initializeSelection = (editor) => {
        // solve a bug where the selection is not intialized properly making it impossible to add ul/ol'

        const orgSelection = editor.getSelection();
        // check if the initialization is already correct.
        if (orgSelection.startContainer.tagName !== 'BODY' && orgSelection.endContainer.tagName !== 'BODY') {
            return;
        }
        editor.moveCursorToStart();
    };

    const toDefault = (message, editor) => {
        const value = message.getDecryptedBody();
        const txt = textToHtmlMail.parse(value, message);

        $rootScope.$applyAsync(() => {
            message.MIMEType = MODE.DEFAULT;
            message.setDecryptedBody(txt, false);
            editor.setHTML(message.getDecryptedBody());
            initializeSelection(editor);
            if (message.RightToLeft) {
                editor.setTextDirectionRTL();
            }
        });
    };

    /**
     * Convert a message to plaintext
     * Allow use to load a message as plaintext
     * @param  {Message}  message
     * @param  {Squire}  editor
     * @param  {Boolean} noParse Should we parse the HTML from the editor or use the plaintext saved ?
     * @return {void}
     */
    const toPlainText = (message, editor, noParse = false) => {

        // Remove focus from the editor to prevent inserting more text.
        editor.blur();
        const plaintext = !noParse ? htmlToTextMail(editor) : message.getDecryptedBody();

        // remove attachments
        const list = message.Attachments.filter(embeddedUtils.isEmbedded);
        dispatcher['attachment.upload']('remove.all', { message, list });
        CACHE.ATTACHMENTS_PROCESSING[message.ID] = CACHE.ATTACHMENTS_PROCESSING[message.ID] || {};
        const map = list.reduce((acc, { ID }) => ((acc[ID] = true), acc), {});
        _.extend(CACHE.ATTACHMENTS_PROCESSING[message.ID], map);

        $rootScope.$applyAsync(() => {
            message.setDecryptedBody(plaintext, false);
            message.MIMEType = MODE.PLAINTEXT;
        });
    };

    const check = (message) => {
        if (!canToggle(message)) {
            return;
        }

        const { editor } = editorModel.find(message);
        return editor;
    };

    const toggle = (message) => {
        const editor = check();

        if (!editor) {
            return;
        }

        if (message.MIMEType === MODE.PLAINTEXT) {
            return toDefault(message, editor);
        }

        toPlainText(message, editor);

        if (!canToggle(message)) {
            dispatch('disableToggle', message);
        }
    };

    const getMode = ({ MIMEType }) => MIMEType;
    const isMode = (mode, message) => getMode(message) === mode;

    const actionFactory = (cb) => ({ message, argument }) => {
        const editor = !isMode(argument.value, message) && check(message);
        editor && cb(message, editor);
    };

    const action = {
        [MODE.PLAINTEXT]: actionFactory(toPlainText),
        [MODE.DEFAULT]: actionFactory(toDefault)
    };

    on('squire.editor', (event, { type, data }) => {
        if (type === 'squireActions' && data.action === 'setEditorMode') {
            action[data.argument.value](data);
        }
    });

    const clear = ({ ID }) => {
        delete CACHE.CAN_TOGGLE[ID];
        delete CACHE.ATTACHMENTS_PROCESSING[ID];
    };

    return { init: angular.noop, getMode, toggle, clear, toPlainText };
}

export default toggleModeEditor;
