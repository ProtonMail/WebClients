import type { RefObject } from 'react';
import { useState } from 'react';

import { useHandler, useNotifications } from '@proton/components';
import type { PublicKeyReference } from '@proton/crypto';
import type { MessageState, MessageStateWithData } from '@proton/mail/store/messages/messagesTypes';
import type { Attachment } from '@proton/shared/lib/interfaces/mail/Message';
import { ATTACHMENT_DISPOSITION } from '@proton/shared/lib/mail/constants';
import { EO_REPLY_NUM_ATTACHMENTS_LIMIT } from '@proton/shared/lib/mail/eo/constants';
import { getAttachments, isPlainText } from '@proton/shared/lib/mail/messages';

import type { MessageChange } from '../../components/composer/Composer';
import type { ExternalEditorActions } from '../../components/composer/editor/EditorWrapper';
import { checkSizeAndLength, uploadEO } from '../../helpers/attachment/attachmentUploader';
import {
    createEmbeddedImageFromUpload,
    isEmbeddable,
    matchSameCidOrLoc,
    readContentIDandLocation,
} from '../../helpers/message/messageEmbeddeds';
import { getEmbeddedImages, updateImages } from '../../helpers/message/messageImages';

interface Props {
    message: MessageState;
    onChange: MessageChange;
    editorActionsRef: RefObject<ExternalEditorActions | undefined>;
    encryptionKey?: PublicKeyReference;
}

export const useEOAttachments = ({ message, onChange, editorActionsRef, encryptionKey }: Props) => {
    const { createNotification } = useNotifications();

    const [imagesToInsert, setImagesToInsert] = useState<File[]>([]);

    /**
     * Start uploading a file, the choice between attachment or inline is done.
     */
    const handleAddAttachmentsUpload = useHandler(
        async (action: ATTACHMENT_DISPOSITION, files: File[] = [], removeImageMetadata?: boolean) => {
            if (encryptionKey) {
                files.forEach((file: File) => {
                    void uploadEO(
                        file,
                        message as MessageStateWithData,
                        encryptionKey,
                        action,
                        removeImageMetadata
                    ).then(({ attachment, packets }) => {
                        // Warning, that change function can be called multiple times, don't do any side effect in it
                        onChange((message: MessageState) => {
                            // New attachment list
                            const Attachments = [...getAttachments(message.data), attachment];
                            const embeddedImages = getEmbeddedImages(message);

                            if (action === ATTACHMENT_DISPOSITION.INLINE) {
                                embeddedImages.push(createEmbeddedImageFromUpload(attachment));
                            }

                            const messageImages = updateImages(
                                message.messageImages,
                                undefined,
                                undefined,
                                embeddedImages
                            );

                            return { data: { Attachments }, messageImages };
                        });

                        if (action === ATTACHMENT_DISPOSITION.INLINE) {
                            editorActionsRef.current?.insertEmbedded(attachment, packets.Preview);
                        }
                    });
                });
            }
        }
    );

    /**
     * Entry point for upload, will check and ask for attachment action if possible
     */
    const handleAddAttachments = useHandler(async (files: File[]) => {
        const embeddable = files.every((file) => isEmbeddable(file.type));
        const plainText = isPlainText(message.data);

        const hasReachedLimits = checkSizeAndLength({
            createNotification,
            message,
            files,
            attachmentsCountLimit: EO_REPLY_NUM_ATTACHMENTS_LIMIT,
        });

        if (hasReachedLimits) {
            return;
        }

        if (!plainText && embeddable) {
            setImagesToInsert(files);
        } else {
            void handleAddAttachmentsUpload(ATTACHMENT_DISPOSITION.ATTACHMENT, files);
        }
    });

    /**
     * Remove an existing attachment, deal with potential embedded image
     */
    const handleRemoveAttachment = useHandler(async (attachment: Attachment) => {
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

    const handleUploadImage = (action: ATTACHMENT_DISPOSITION, removeImageMetadata?: boolean) => {
        void handleAddAttachmentsUpload(action, imagesToInsert, removeImageMetadata);
        setImagesToInsert([]);
    };

    return {
        imagesToInsert,
        setImagesToInsert,
        handleAddAttachments,
        handleAddAttachmentsUpload,
        handleRemoveAttachment,
        handleUploadImage,
    };
};
