import { Attachment } from 'proton-shared/lib/interfaces/mail/Message';
import { getAttachments, isPlainText } from 'proton-shared/lib/mail/messages';
import { useState, useCallback } from 'react';
import { useApi, useNotifications, useAuthentication, useHandler } from 'react-components';
import { c } from 'ttag';
import { removeAttachment } from 'proton-shared/lib/api/attachments';
import { readFileAsBuffer } from 'proton-shared/lib/helpers/file';
import { Upload } from '../../helpers/upload';
import { UploadResult, ATTACHMENT_ACTION, isSizeExceeded, upload } from '../../helpers/attachment/attachmentUploader';
import { MessageExtended, MessageExtendedWithData } from '../../models/message';
import { EditorActionsRef } from '../../components/composer/editor/SquireEditorWrapper';
import { MessageChange } from '../../components/composer/Composer';
import { useMessageCache } from '../../containers/MessageProvider';
import { useAttachmentCache } from '../../containers/AttachmentProvider';
import { useGetMessageKeys } from '../message/useGetMessageKeys';
import { useLongLivingState } from '../useLongLivingState';
import { usePromise } from '../usePromise';
import { getEmbeddedImages, updateImages } from '../../helpers/message/messageImages';
import { createEmbeddedImageFromUpload, isEmbeddable, readCID } from '../../helpers/message/messageEmbeddeds';

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
    // Long living because we have to track upload progress after closing
    const [pendingUploads, setPendingUploads, getPendingUpload] = useLongLivingState<PendingUpload[]>([]);

    const {
        promise: promiseUpload,
        resolver: resolveUpload,
        rejecter: rejectUpload,
        renew: newUpload,
        isPending: uploadInProgress,
    } = usePromise<void>();

    const { localID } = message;

    const updatePendingUpload = useHandler((pendingUploads: PendingUpload[], error?: any) => {
        const previousValue = getPendingUpload();
        setPendingUploads(pendingUploads);

        if (error) {
            rejectUpload(error);
        } else if (!pendingUploads.length && previousValue.length) {
            resolveUpload();
        }
    });

    const addPendingUploads = (pendingUploads: PendingUpload[]) => {
        updatePendingUpload([...getPendingUpload(), ...pendingUploads]);
    };

    const removePendingUpload = (pendingUpload: PendingUpload, error?: any) => {
        updatePendingUpload(
            getPendingUpload().filter((aPendingUpload) => aPendingUpload !== pendingUpload),
            error
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
                const embeddedImages = getEmbeddedImages(message);

                if (action === ATTACHMENT_ACTION.INLINE) {
                    embeddedImages.push(createEmbeddedImageFromUpload(upload));

                    setTimeout(() => {
                        editorActionsRef.current?.insertEmbedded(upload.attachment, upload.packets.Preview);
                    });
                }

                const messageImages = updateImages(message.messageImages, undefined, undefined, embeddedImages);

                return { data: { Attachments }, messageImages };
            });
            removePendingUpload(pendingUpload);
        } catch (error) {
            removePendingUpload(pendingUpload, error);
        }
    });

    const checkSize = (files: File[]) => {
        const pendingUploadFiles = pendingUploads.map((upload) => upload.file);

        const sizeExcedeed = isSizeExceeded(message, [...files, ...pendingUploadFiles]);
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

            // Trigger upload state before ensureMessageIsCreated
            // In case of the user close or send even before
            if (getPendingUpload().length === 0) {
                newUpload();
            }

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
                const embeddedImages = getEmbeddedImages(message);
                const embeddedImage = embeddedImages.find((image) => image.cid === cid);
                const newEmbeddedImages = embeddedImages.filter((image) => image.cid !== cid);

                if (embeddedImage) {
                    setTimeout(() => {
                        editorActionsRef.current?.removeEmbedded(embeddedImage.attachment);
                    });
                }

                const messageImages = updateImages(message.messageImages, undefined, undefined, newEmbeddedImages);

                return { data: { Attachments }, messageImages };
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
        promiseUpload,
        uploadInProgress,
        handleAddAttachmentsStart,
        handleAddEmbeddedImages,
        handleAddAttachmentsUpload,
        handleCancelAddAttachment,
        handleRemoveAttachment,
        handleRemoveUpload,
    };
};
