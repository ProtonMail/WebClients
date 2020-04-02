import { useState } from 'react';
import { useApi, useNotifications, useAuthentication } from 'react-components';
import { c } from 'ttag';

import { Upload } from '../helpers/upload';
import { UploadResult, ATTACHMENT_ACTION, isSizeExceeded, upload } from '../helpers/attachment/attachmentUploader';
import { useHandler } from './useHandler';
import { getAttachments, isPlainText } from '../helpers/message/messages';
import {
    readCID,
    isEmbeddable,
    createEmbeddedMap,
    createEmbeddedInfo,
    cloneEmbedddedMap
} from '../helpers/embedded/embeddeds';
import { MessageExtended } from '../models/message';
import { Attachment } from '../models/attachment';
import { removeAttachment } from '../api/attachments';
import { EditorActionsRef } from '../components/composer/editor/Editor';
import { MessageChange } from '../components/composer/Composer';

export interface PendingUpload {
    file: File;
    upload: Upload<UploadResult>;
}

export const useAttachments = (
    message: MessageExtended,
    onChange: MessageChange,
    editorActionsRef: EditorActionsRef
) => {
    const api = useApi();
    const { createNotification } = useNotifications();
    const auth = useAuthentication();

    // Pending files to upload
    const [pendingFiles, setPendingFiles] = useState<File[]>();

    // Pending uploads
    const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>();

    const removePendingUpload = (pendingUpload: PendingUpload) => {
        const newPendingUploads = pendingUploads?.filter((aPendingUpload) => aPendingUpload !== pendingUpload);
        setPendingUploads(newPendingUploads);
    };

    /**
     * Wait for upload to finish, modify the message, add to embedded images if needed
     */
    const handleAddAttachmentEnd = useHandler(async (action: ATTACHMENT_ACTION, pendingUpload: PendingUpload) => {
        const upload = await pendingUpload.upload.resultPromise;

        removePendingUpload(pendingUpload);

        onChange((message: MessageExtended) => {
            // New attachment list
            const Attachments = [...getAttachments(message.data), upload.attachment];

            // Update embeddeds map if embedded attachments
            const embeddeds = cloneEmbedddedMap(message.embeddeds);

            if (action == ATTACHMENT_ACTION.INLINE) {
                const embeddedsToInsert = createEmbeddedMap();
                const cid = readCID(upload.attachment);
                const info = createEmbeddedInfo(upload);

                embeddedsToInsert.set(cid, info);
                embeddeds.set(cid, info);

                setTimeout(() => {
                    editorActionsRef.current?.insertEmbedded(embeddedsToInsert);
                });
            }

            return { embeddeds, data: { Attachments } };
        });
    });

    const checkSize = (files: File[]) => {
        const sizeExcedeed = isSizeExceeded(message, files);
        if (sizeExcedeed) {
            createNotification({
                type: 'error',
                text: c('Error').t`Attachments are limited to 25 MB.`
            });
        }
        return sizeExcedeed;
    };

    /**
     * Start uploading a file, the choice between attachment or inline is done.
     */
    const handleAddAttachmentsUpload = async (action: ATTACHMENT_ACTION, files = pendingFiles || []) => {
        setPendingFiles(undefined);

        const uploads = upload(files, message, action, auth.UID);
        const pendingUploads = files?.map((file, i) => ({ file, upload: uploads[i] }));
        setPendingUploads(pendingUploads);

        pendingUploads.forEach((pendingUpload) => handleAddAttachmentEnd(action, pendingUpload));
    };

    /**
     * Trigger an directly an embedded upload.
     */
    const handleAddEmbeddedImages = async (files: File[]) => {
        if (checkSize(files)) {
            return;
        }

        handleAddAttachmentsUpload(ATTACHMENT_ACTION.INLINE, files);
    };

    /**
     * Entry point for upload, will check and ask for attachment action if possible
     */
    const handleAddAttachmentsStart = async (files: File[]) => {
        const embeddable = files.every((file) => isEmbeddable(file.type));
        const plainText = isPlainText(message.data);

        if (checkSize(files)) {
            return;
        }

        if (!plainText && embeddable) {
            setPendingFiles(files);
        } else {
            handleAddAttachmentsUpload(ATTACHMENT_ACTION.ATTACHMENT, files);
        }
    };

    const handleCancelAddAttachment = () => setPendingFiles(undefined);

    /**
     * Remove an existing attachment, deal with potential embedded image
     */
    const handleRemoveAttachment = (attachment: Attachment) => async () => {
        await api(removeAttachment(attachment.ID || '', message.data?.ID || ''));

        onChange((message: MessageExtended) => {
            const Attachments = message.data?.Attachments?.filter((a: Attachment) => a.ID !== attachment.ID) || [];

            const cid = readCID(attachment);
            const embeddeds = cloneEmbedddedMap(message.embeddeds);

            if (embeddeds.has(cid)) {
                embeddeds.delete(cid);

                setTimeout(() => {
                    editorActionsRef.current?.removeEmbedded([attachment]);
                });
            }

            return { embeddeds, data: { Attachments } };
        });
    };

    /**
     * Cancel pending upload
     */
    const handleRemoveUpload = (pendingUpload: PendingUpload) => () => {
        pendingUpload.upload.abort();
        removePendingUpload(pendingUpload);
    };

    return {
        pendingFiles,
        pendingUploads,
        handleAddAttachmentsStart,
        handleAddEmbeddedImages,
        handleAddAttachmentsUpload,
        handleCancelAddAttachment,
        handleRemoveAttachment,
        handleRemoveUpload
    };
};
