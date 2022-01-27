import { Attachment } from '@proton/shared/lib/interfaces/mail/Message';
import { getAttachments, isPlainText } from '@proton/shared/lib/mail/messages';
import { MutableRefObject, useState } from 'react';
import { useApi, useNotifications, useAuthentication, useHandler } from '@proton/components';
import { removeAttachment } from '@proton/shared/lib/api/attachments';
import { readFileAsBuffer } from '@proton/shared/lib/helpers/file';
import { useDispatch } from 'react-redux';
import { Upload } from '../../helpers/upload';
import { UploadResult, ATTACHMENT_ACTION, upload, checkSize } from '../../helpers/attachment/attachmentUploader';
import { MessageChange } from '../../components/composer/Composer';
import { useGetMessageKeys } from '../message/useGetMessageKeys';
import { useLongLivingState } from '../useLongLivingState';
import { usePromise } from '../usePromise';
import { getEmbeddedImages, updateImages } from '../../helpers/message/messageImages';
import {
    createEmbeddedImageFromUpload,
    isEmbeddable,
    matchSameCidOrLoc,
    readContentIDandLocation,
} from '../../helpers/message/messageEmbeddeds';
import { MESSAGE_ALREADY_SENT_INTERNAL_ERROR } from '../../constants';
import { addAttachment } from '../../logic/attachments/attachmentsActions';
import { MessageState, MessageStateWithData } from '../../logic/messages/messagesTypes';
import { useGetMessage } from '../message/useMessage';
import { ExternalEditorActions } from '../../components/composer/editor/EditorWrapper';

export interface PendingUpload {
    file: File;
    upload: Upload<UploadResult>;
}

interface UseAttachmentsParameters {
    message: MessageState;
    onChange: MessageChange;
    onSaveNow: () => Promise<void>;
    editorActionsRef: MutableRefObject<ExternalEditorActions | undefined>;
    onMessageAlreadySent: () => void;
}

export const useAttachments = ({
    message,
    onChange,
    onSaveNow,
    editorActionsRef,
    onMessageAlreadySent,
}: UseAttachmentsParameters) => {
    const api = useApi();
    const { createNotification } = useNotifications();
    const auth = useAuthentication();
    const getMessage = useGetMessage();
    const getMessageKeys = useGetMessageKeys();
    const dispatch = useDispatch();

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
        return getMessage(localID) as MessageStateWithData;
    };

    /**
     * Wait for upload to finish, modify the message, add to embedded images if needed
     */
    const handleAddAttachmentEnd = useHandler(async (action: ATTACHMENT_ACTION, pendingUpload: PendingUpload) => {
        try {
            const upload = await pendingUpload.upload.resultPromise;

            const data = new Uint8Array(await readFileAsBuffer(pendingUpload.file));
            const filename = pendingUpload.file.name;
            dispatch(
                addAttachment({
                    ID: upload.attachment.ID || '',
                    attachment: { data, verified: 1, filename, signatures: [] },
                })
            );

            // Warning, that change function can be called multiple times, don't do any side effect in it
            onChange((message: MessageState) => {
                // New attachment list
                const Attachments = [...getAttachments(message.data), upload.attachment];
                const embeddedImages = getEmbeddedImages(message);

                if (action === ATTACHMENT_ACTION.INLINE) {
                    embeddedImages.push(createEmbeddedImageFromUpload(upload.attachment));
                }

                const messageImages = updateImages(message.messageImages, undefined, undefined, embeddedImages);

                return { data: { Attachments }, messageImages };
            });

            if (action === ATTACHMENT_ACTION.INLINE) {
                editorActionsRef.current?.insertEmbedded(upload.attachment, upload.packets.Preview);
            }

            removePendingUpload(pendingUpload);
        } catch (error: any) {
            if (error?.message === MESSAGE_ALREADY_SENT_INTERNAL_ERROR) {
                onMessageAlreadySent();
            }

            removePendingUpload(pendingUpload, error);
        }
    });

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

            const messageFromState = await ensureMessageIsCreated();
            const messageKeys = await getMessageKeys(messageFromState.data);

            // Message already sent
            if (messageFromState.draftFlags?.isSentDraft) {
                onMessageAlreadySent();
                return;
            }

            const uploads = upload(files, messageFromState, messageKeys, action, auth.UID);

            const pendingUploads = files.map((file, i) => ({ file, upload: uploads[i] }));
            addPendingUploads(pendingUploads);

            pendingUploads.forEach((pendingUpload) => handleAddAttachmentEnd(action, pendingUpload));
        }
    );

    /**
     * Trigger an directly an embedded upload.
     */
    const handleAddEmbeddedImages = async (files: File[]) => {
        const pendingUploadFiles = pendingUploads.map((upload) => upload.file);

        if (checkSize(createNotification, message, files, pendingUploadFiles)) {
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
        const pendingUploadFiles = pendingUploads.map((upload) => upload.file);

        if (checkSize(createNotification, message, files, pendingUploadFiles)) {
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
    const handleRemoveAttachment = useHandler(async (attachment: Attachment) => {
        if (attachment.ID && message.data?.ID) {
            await api(removeAttachment(attachment.ID, message.data.ID));
        }

        onChange((message: MessageState) => {
            const Attachments = message.data?.Attachments?.filter((a: Attachment) => a.ID !== attachment.ID) || [];

            const { cid, cloc } = readContentIDandLocation(attachment);
            const embeddedImages = getEmbeddedImages(message);
            const embeddedImage = embeddedImages.find((image) => matchSameCidOrLoc(image, cid, cloc));
            const newEmbeddedImages = embeddedImages.filter((image) => !matchSameCidOrLoc(image, cid, cloc));

            if (embeddedImage) {
                setTimeout(() => {
                    editorActionsRef.current?.removeEmbedded(embeddedImage.attachment);
                });
            }

            const messageImages = updateImages(message.messageImages, undefined, undefined, newEmbeddedImages);

            return { data: { Attachments }, messageImages };
        });
    });

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
