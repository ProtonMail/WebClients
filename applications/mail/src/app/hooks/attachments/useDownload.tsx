import { useCallback } from 'react';

import { useApi } from '@proton/components';
import { useModalTwo } from '@proton/components/components/modalTwo/useModalTwo';
import type { WorkerDecryptionResult } from '@proton/crypto';
import { FeatureCode, useFeature } from '@proton/features';
import type { Attachment } from '@proton/shared/lib/interfaces/mail/Message';
import { VERIFICATION_STATUS } from '@proton/shared/lib/mail/constants';
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
import type { MessageKeys, MessageStateWithData, OutsideKey } from '../../store/messages/messagesTypes';
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

    const onUpdateAttachment = (ID: string, attachment: WorkerDecryptionResult<Uint8Array>) => {
        dispatch(updateAttachment({ ID, attachment }));
    };

    const handleDownload = useCallback(
        async (message: MessageStateWithData, attachment: Attachment, outsideKey?: MessageKeys) => {
            let download;
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
                    getAttachment,
                    message.data.Flags
                );
            }

            if (download.isError || download.verified === VERIFICATION_STATUS.SIGNED_AND_INVALID) {
                await handleShowModal({ downloads: [download] });
            }

            await generateDownload(download);
            return download.verified;
        },
        [api]
    );

    return { handleDownload, confirmDownloadModal };
};

export const useDownloadAll = () => {
    const api = useApi();
    const getAttachment = useGetAttachment();
    const dispatch = useMailDispatch();
    const getMessageKeys = useSyncedMessageKeys();
    const isNumAttachmentsWithoutEmbedded = useFeature(FeatureCode.NumAttachmentsWithoutEmbedded).feature?.Value;
    const [confirmDownloadModal, handleShowModal] = useModalTwo(ConfirmDownloadAttachments);

    const onUpdateAttachment = (ID: string, attachment: WorkerDecryptionResult<Uint8Array>) => {
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
                ({ verified }) => verified === VERIFICATION_STATUS.SIGNED_AND_INVALID
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

    const onUpdateAttachment = (ID: string, attachment: WorkerDecryptionResult<Uint8Array>) => {
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

            if (download.isError || download.verified === VERIFICATION_STATUS.SIGNED_AND_INVALID) {
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
