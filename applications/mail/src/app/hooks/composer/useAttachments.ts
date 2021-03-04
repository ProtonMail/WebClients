import { Attachment } from 'proton-shared/lib/interfaces/mail/Message';
import { getAttachments, isPlainText } from 'proton-shared/lib/mail/messages';
import { useState, useMemo, useCallback } from 'react';
import { useApi, useNotifications, useAuthentication, useHandler } from 'react-components';
import { c } from 'ttag';
import { removeAttachment } from 'proton-shared/lib/api/attachments';
import { readFileAsBuffer } from 'proton-shared/lib/helpers/file';
import { Upload } from '../../helpers/upload';
import { UploadResult, ATTACHMENT_ACTION, isSizeExceeded, upload } from '../../helpers/attachment/attachmentUploader';
import {
    readCID,
    isEmbeddable,
    createEmbeddedMap,
    createEmbeddedInfo,
    cloneEmbedddedMap,
} from '../../helpers/embedded/embeddeds';
import { MessageExtended, MessageExtendedWithData } from '../../models/message';
import { EditorActionsRef } from '../../components/composer/editor/SquireEditorWrapper';
import { MessageChange } from '../../components/composer/Composer';
import { useMessageCache } from '../../containers/MessageProvider';
import { useAttachmentCache } from '../../containers/AttachmentProvider';
import { useGetMessageKeys } from '../message/useGetMessageKeys';

export interface PendingUpload {
    file: File;
    upload: Upload<UploadResult>;
}

export const useAttachments = (
    message: MessageExtended,
    onChange: MessageChange,
    onSaveNow: () => Promise<void>,
    editorActionsRef: EditorActionsRef
) => {
    const api = useApi();
    const { createNotification } = useNotifications();
    const auth = useAuthentication();
    const messageCache = useMessageCache();
    const getMessageKeys = useGetMessageKeys();
    const attachmentCache = useAttachmentCache();

    // Pending files to upload
    const [pendingFiles, setPendingFiles] = useState<File[]>();

    // Pending uploads
    const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>();

    const { localID } = message;

    const uploadInProgress = useMemo(() => {
        return (pendingUploads?.length || 0) > 0;
    }, [pendingUploads]);

    const addPendingUploads = (newPendingUploads: PendingUpload[]) => {
        setPendingUploads((pendingUploads) => [...(pendingUploads || []), ...newPendingUploads]);
    };

    const removePendingUpload = (pendingUpload: PendingUpload) => {
        setPendingUploads((pendingUploads) =>
            pendingUploads?.filter((aPendingUpload) => aPendingUpload !== pendingUpload)
        );
    };

    const ensureMessageIsCreated = async () => {
        await onSaveNow();
        // Message from cache has data because we just saved it if not
        return messageCache.get(localID) as MessageExtendedWithData;
    };

    /**
     * Wait for upload to finish, modify the message, add to embedded images if needed
     */
    const handleAddAttachmentEnd = useHandler(async (action: ATTACHMENT_ACTION, pendingUpload: PendingUpload) => {
        try {
            const upload = await pendingUpload.upload.resultPromise;

            const data = new Uint8Array(await readFileAsBuffer(pendingUpload.file));
            const filename = pendingUpload.file.name;
            attachmentCache.set(upload.attachment.ID || '', { data, verified: 1, filename, signatures: [] });

            onChange((message: MessageExtended) => {
                // New attachment list
                const Attachments = [...getAttachments(message.data), upload.attachment];

                // Update embeddeds map if embedded attachments
                const embeddeds = cloneEmbedddedMap(message.embeddeds);

                if (action === ATTACHMENT_ACTION.INLINE) {
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
        } finally {
            removePendingUpload(pendingUpload);
        }
    });

    const checkSize = (files: File[]) => {
        const sizeExcedeed = isSizeExceeded(message, files);
        if (sizeExcedeed) {
            createNotification({
                type: 'error',
                text: c('Error').t`Attachments are limited to 25 MB.`,
            });
        }
        return sizeExcedeed;
    };

    /**
     * Start uploading a file, the choice between attachment or inline is done.
     */
    const handleAddAttachmentsUpload = useHandler(
        async (action: ATTACHMENT_ACTION, files: File[] = pendingFiles || []) => {
            setPendingFiles(undefined);

            const messageFromCache = await ensureMessageIsCreated();
            const messageKeys = await getMessageKeys(messageFromCache.data);
            const uploads = upload(files, messageFromCache, messageKeys, action, auth.UID);
            const pendingUploads = files.map((file, i) => ({ file, upload: uploads[i] }));
            addPendingUploads(pendingUploads);

            pendingUploads.forEach((pendingUpload) => handleAddAttachmentEnd(action, pendingUpload));
        }
    );

    /**
     * Trigger an directly an embedded upload.
     */
    const handleAddEmbeddedImages = async (files: File[]) => {
        if (checkSize(files)) {
            return;
        }

        void handleAddAttachmentsUpload(ATTACHMENT_ACTION.INLINE, files);
    };

    /**
     * Entry point for upload, will check and ask for attachment action if possible
     */
    const handleAddAttachmentsStart = useHandler(async (files: File[]) => {
        const embeddable = files.every((file) => isEmbeddable(file.type));
        const plainText = isPlainText(message.data);

        if (checkSize(files)) {
            return;
        }

        if (!plainText && embeddable) {
            setPendingFiles(files);
        } else {
            void handleAddAttachmentsUpload(ATTACHMENT_ACTION.ATTACHMENT, files);
        }
    });

    const handleCancelAddAttachment = () => setPendingFiles(undefined);

    /**
     * Remove an existing attachment, deal with potential embedded image
     */
    const handleRemoveAttachment = useCallback(
        async (attachment: Attachment) => {
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
        },
        [onChange]
    );

    /**
     * Cancel pending upload
     */
    const handleRemoveUpload = async (pendingUpload: PendingUpload) => {
        pendingUpload.upload.abort();
        void removePendingUpload(pendingUpload);
    };

    return {
        pendingFiles,
        pendingUploads,
        uploadInProgress,
        handleAddAttachmentsStart,
        handleAddEmbeddedImages,
        handleAddAttachmentsUpload,
        handleCancelAddAttachment,
        handleRemoveAttachment,
        handleRemoveUpload,
    };
};
