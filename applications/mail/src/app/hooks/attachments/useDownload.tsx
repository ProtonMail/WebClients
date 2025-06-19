import { useCallback } from 'react';

import { useApi } from '@proton/components';
import { useModalTwo } from '@proton/components/components/modalTwo/useModalTwo';
import { FeatureCode, useFeature } from '@proton/features';
import type { MessageKeys, MessageStateWithData, OutsideKey } from '@proton/mail/store/messages/messagesTypes';
import type { Attachment } from '@proton/shared/lib/interfaces/mail/Message';
import { MAIL_VERIFICATION_STATUS } from '@proton/shared/lib/mail/constants';
import { getAttachments } from '@proton/shared/lib/mail/messages';

import { useMailDispatch } from 'proton-mail/store/hooks';

import ConfirmDownloadAttachments from '../../components/attachment/modals/ConfirmDownloadAttachments';
import type { Download } from '../../helpers/attachment/attachmentDownloader';
import {
    formatDownload,
    formatDownloadAll,
    generateDownload,
    generateDownloadAll,
} from '../../helpers/attachment/attachmentDownloader';
import { getAttachmentCounts } from '../../helpers/message/messages';
import { updateAttachment } from '../../store/attachments/attachmentsActions';
import type { DecryptedAttachment } from '../../store/attachments/attachmentsTypes';
import { useGetMessageKeys } from '../message/useGetMessageKeys';
import { useGetMessage } from '../message/useMessage';
import { useGetAttachment } from './useAttachment';

/**
 * Returns the keys from the sender of the message version in cache
 * Extra security here because when used in the composer context,
 * sender address can be desynchronized from the attachment key packets
 */
const useSyncedMessageKeys = () => {
    const getMessage = useGetMessage();
    const getMessageKeys = useGetMessageKeys();

    return (localID: string) => {
        const messageFromCache = getMessage(localID) as MessageStateWithData;
        return getMessageKeys(messageFromCache.data);
    };
};

export const useDownload = () => {
    const api = useApi();
    const getAttachment = useGetAttachment();
    const dispatch = useMailDispatch();
    const getMessageKeys = useSyncedMessageKeys();
    const [confirmDownloadModal, handleShowModal] = useModalTwo(ConfirmDownloadAttachments);

    const onUpdateAttachment = (ID: string, attachment: DecryptedAttachment) => {
        dispatch(updateAttachment({ ID, attachment }));
    };

    const getDownload = useCallback(
        async (message: MessageStateWithData, attachment: Attachment, outsideKey?: MessageKeys) => {
            if (!outsideKey) {
                const messageKeys = await getMessageKeys(message.localID);
                return formatDownload(
                    attachment,
                    message.verification,
                    messageKeys,
                    onUpdateAttachment,
                    api,
                    getAttachment,
                    message.data.Flags
                );
            } else {
                return formatDownload(
                    attachment,
                    message.verification,
                    outsideKey,
                    onUpdateAttachment,
                    api,
                    getAttachment,
                    message.data.Flags
                );
            }
        },
        [api]
    );

    const handleDownload = useCallback(
        async (message: MessageStateWithData, attachment: Attachment, outsideKey?: MessageKeys) => {
            const download = await getDownload(message, attachment, outsideKey);

            if (download.isError || download.verificationStatus === MAIL_VERIFICATION_STATUS.SIGNED_AND_INVALID) {
                await handleShowModal({ downloads: [download] });
            }

            await generateDownload(download);
            return download.verificationStatus;
        },
        [api]
    );

    const getDownloadStreamInfo = useCallback(
        async (message: MessageStateWithData, attachment: Attachment, outsideKey?: MessageKeys) => {
            const download = await getDownload(message, attachment, outsideKey);
            const blob = new Blob([download.data]);
            return {
                // A byte stream of the attachment.
                stream: blob.stream(),
                // The unencrypted size of the attachment. The encrypted size is
                // always a little bigger due to encryption overhead
                // This value needs to be used when uploading via the Drive SDK
                // for integrity verification
                size: blob.size,
                // The MIME type of the attachment.
                type: blob.type,
            };
        },
        []
    );

    return { handleDownload, confirmDownloadModal, getDownloadStreamInfo };
};

export const useDownloadAll = () => {
    const api = useApi();
    const getAttachment = useGetAttachment();
    const dispatch = useMailDispatch();
    const getMessageKeys = useSyncedMessageKeys();
    const isNumAttachmentsWithoutEmbedded = useFeature(FeatureCode.NumAttachmentsWithoutEmbedded).feature?.Value;
    const [confirmDownloadModal, handleShowModal] = useModalTwo(ConfirmDownloadAttachments);

    const onUpdateAttachment = (ID: string, attachment: DecryptedAttachment) => {
        dispatch(updateAttachment({ ID, attachment }));
    };

    const handleDownloadAll = useCallback(
        async (message: MessageStateWithData, outsideKey?: MessageKeys) => {
            const attachments = getAttachments(message.data);
            const { pureAttachments } = getAttachmentCounts(attachments, message.messageImages);

            let list;
            if (!outsideKey) {
                const messageKeys = await getMessageKeys(message.localID);
                list = await formatDownloadAll(
                    isNumAttachmentsWithoutEmbedded ? pureAttachments : attachments,
                    message.verification,
                    messageKeys,
                    onUpdateAttachment,
                    api,
                    getAttachment,
                    message.data.Flags
                );
            } else {
                list = await formatDownloadAll(
                    isNumAttachmentsWithoutEmbedded ? pureAttachments : attachments,
                    message.verification,
                    outsideKey,
                    onUpdateAttachment,
                    api,
                    undefined,
                    message.data.Flags
                );
            }

            const isError = list.some(({ isError }) => isError);
            const senderVerificationFailed = list.some(
                ({ verificationStatus }) => verificationStatus === MAIL_VERIFICATION_STATUS.SIGNED_AND_INVALID
            );

            if (isError || senderVerificationFailed) {
                await handleShowModal({ downloads: list });
            }

            await generateDownloadAll(message.data, list);
        },
        [api]
    );

    return { handleDownloadAll, confirmDownloadModal };
};

export const usePreview = () => {
    const api = useApi();
    const getAttachment = useGetAttachment();
    const dispatch = useMailDispatch();
    const getMessageKeys = useSyncedMessageKeys();
    const [confirmDownloadModal, handleShowModal] = useModalTwo(ConfirmDownloadAttachments);

    const onUpdateAttachment = (ID: string, attachment: DecryptedAttachment) => {
        dispatch(updateAttachment({ ID, attachment }));
    };

    const handlePreview = useCallback(
        async (message: MessageStateWithData, attachment: Attachment, outsideKey?: OutsideKey) => {
            let download: Download;

            if (!outsideKey) {
                const messageKeys = await getMessageKeys(message.localID);
                download = await formatDownload(
                    attachment,
                    message.verification,
                    messageKeys,
                    onUpdateAttachment,
                    api,
                    getAttachment,
                    message.data.Flags
                );
            } else {
                download = await formatDownload(
                    attachment,
                    message.verification,
                    outsideKey,
                    onUpdateAttachment,
                    api,
                    undefined,
                    message.data.Flags
                );
            }

            if (download.isError || download.verificationStatus === MAIL_VERIFICATION_STATUS.SIGNED_AND_INVALID) {
                const handleError = async () => {
                    await handleShowModal({ downloads: [download] });
                    await generateDownload(download);
                };

                void handleError();
            }

            return download;
        },
        [api]
    );

    return { handlePreview, confirmDownloadModal };
};
