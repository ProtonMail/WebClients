import _ from 'lodash';
import { MIME_TYPES } from '../../constants';
import { toText } from '../../../helpers/parserHTML';

const { DEFAULT, PLAINTEXT } = MIME_TYPES;

/* @ngInject */
function toggleModeEditor(dispatchers, embeddedUtils, attachmentModel, textToHtmlMail) {
    const { on, dispatcher } = dispatchers(['squire.toggleMode', 'attachment.upload', 'message']);

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
            (message.MIMEType !== PLAINTEXT || !hasInlineAttachments(message)) &&
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
        if (
            data.message &&
            (!(data.message.ID in CACHE.CAN_TOGGLE) || CACHE.CAN_TOGGLE[data.message.ID] !== canToggle(data.message))
        ) {
            CACHE.CAN_TOGGLE[data.message.ID] = canToggle(data.message);
            dispatch(CACHE.CAN_TOGGLE[data.message.ID] ? 'enableToggle' : 'disableToggle', data.message);
        }
    });

    const toPlainText = (message, htmlValue) => {
        const list = message.Attachments.filter(embeddedUtils.isEmbedded);
        dispatcher['attachment.upload']('remove.all', { message, list });
        CACHE.ATTACHMENTS_PROCESSING[message.ID] = CACHE.ATTACHMENTS_PROCESSING[message.ID] || {};
        const map = list.reduce((acc, { ID }) => ((acc[ID] = true), acc), {});
        _.extend(CACHE.ATTACHMENTS_PROCESSING[message.ID], map);

        const plaintext = toText(htmlValue);

        message.MIMEType = PLAINTEXT;
        message.setDecryptedBody(plaintext, false);

        // Save the message since it has changed.
        dispatcher.message('updated', { message });

        return plaintext;
    };

    const toHtml = (message, plaintextValue) => {
        const html = textToHtmlMail.parse(plaintextValue, message);

        message.MIMEType = DEFAULT;
        message.setDecryptedBody(html, false);

        // Save the message since it has changed.
        dispatcher.message('updated', { message });

        return html;
    };

    const clear = ({ ID }) => {
        delete CACHE.CAN_TOGGLE[ID];
        delete CACHE.ATTACHMENTS_PROCESSING[ID];
    };

    return {
        canToggle,
        clear,
        toPlainText,
        toHtml
    };
}

export default toggleModeEditor;
