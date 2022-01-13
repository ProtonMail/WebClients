import { Attachment } from '@proton/shared/lib/interfaces/mail/Message';
import { VERIFICATION_STATUS } from '@proton/shared/lib/mail/constants';
import { getAttachments } from '@proton/shared/lib/mail/messages';
import { useCallback } from 'react';
import { Alert, ConfirmModal, FeatureCode, useApi, useFeature, useModals } from '@proton/components';
import { c, msgid } from 'ttag';
import { useDispatch } from 'react-redux';
import { DecryptResultPmcrypto } from 'pmcrypto';
import {
    Download,
    formatDownload,
    formatDownloadAll,
    generateDownload,
    generateDownloadAll,
} from '../helpers/attachment/attachmentDownloader';
import { useGetMessageKeys } from './message/useGetMessageKeys';
import { updateAttachment } from '../logic/attachments/attachmentsActions';
import { useGetAttachment } from './useAttachment';
import { MessageKeys, MessageStateWithData, OutsideKey } from '../logic/messages/messagesTypes';
import { useGetMessage } from './message/useMessage';
import { getAttachmentCounts } from '../helpers/message/messages';

const useShowConfirmModal = () => {
    const { createModal } = useModals();

    return useCallback(
        (downloads: Download[]) =>
            new Promise((resolve, reject) => {
                const total = downloads.length;
                const senderVerificationFailed = downloads.some(
                    ({ verified }) => verified === VERIFICATION_STATUS.SIGNED_AND_INVALID
                );
                const title = senderVerificationFailed
                    ? c('Title').t`Verification error`
                    : c('Title').t`Decryption error`;
                const learnMore = senderVerificationFailed
                    ? 'https://protonmail.com/support/knowledge-base/digital-signature/'
                    : undefined;
                const warningContent = senderVerificationFailed
                    ? c('Warning').ngettext(
                          msgid`The attachment's signature failed verification.
                        You can still download this attachment but it might have been tampered with.`,
                          `Some of the attachments' signatures failed verification.
                        You can still download these attachments but they might have been tampered with.`,
                          total
                      )
                    : c('Error').ngettext(
                          msgid`The attachment could not be decrypted.
                        If you have the corresponding private key, you will still be able to decrypt
                        the file with a program such as GnuPG.`,
                          `Some of the attachments could not be decrypted.
                        If you have the corresponding private key, you will still be able to decrypt
                        the files with a program such as GnuPG.`,
                          total
                      );
                createModal(
                    <ConfirmModal
                        onConfirm={() => resolve(undefined)}
                        onClose={reject}
                        title={title}
                        confirm={c('Action').t`Download`}
                    >
                        <Alert className="mb1" type="warning" learnMore={learnMore}>
                            {warningContent}
                        </Alert>
                        <Alert className="mb1">
                            {c('Info').ngettext(
                                msgid`Do you want to download this attachment anyway?`,
                                `Do you want to download these attachments anyway?`,
                                total
                            )}
                        </Alert>
                    </ConfirmModal>
                );
            }),
        []
    );
};

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
    const dispatch = useDispatch();
    const showConfirmModal = useShowConfirmModal();
    const getMessageKeys = useSyncedMessageKeys();

    const onUpdateAttachment = (ID: string, attachment: DecryptResultPmcrypto) => {
        dispatch(updateAttachment({ ID, attachment }));
    };

    return useCallback(
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
                    getAttachment
                );
            } else {
                download = await formatDownload(
                    attachment,
                    message.verification,
                    outsideKey,
                    onUpdateAttachment,
                    api,
                    getAttachment
                );
            }

            if (download.isError || download.verified === VERIFICATION_STATUS.SIGNED_AND_INVALID) {
                await showConfirmModal([download]);
            }

            await generateDownload(download);
            return download.verified;
        },
        [api]
    );
};

export const useDownloadAll = () => {
    const api = useApi();
    const getAttachment = useGetAttachment();
    const dispatch = useDispatch();
    const showConfirmModal = useShowConfirmModal();
    const getMessageKeys = useSyncedMessageKeys();
    const isNumAttachmentsWithoutEmbedded = useFeature(FeatureCode.NumAttachmentsWithoutEmbedded).feature?.Value;

    const onUpdateAttachment = (ID: string, attachment: DecryptResultPmcrypto) => {
        dispatch(updateAttachment({ ID, attachment }));
    };

    return useCallback(
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
                    getAttachment
                );
            } else {
                list = await formatDownloadAll(
                    isNumAttachmentsWithoutEmbedded ? pureAttachments : attachments,
                    message.verification,
                    outsideKey,
                    onUpdateAttachment,
                    api
                );
            }

            const isError = list.some(({ isError }) => isError);
            const senderVerificationFailed = list.some(
                ({ verified }) => verified === VERIFICATION_STATUS.SIGNED_AND_INVALID
            );

            if (isError || senderVerificationFailed) {
                await showConfirmModal(list);
            }

            await generateDownloadAll(message.data, list);
        },
        [api]
    );
};

export const usePreview = () => {
    const api = useApi();
    const getAttachment = useGetAttachment();
    const dispatch = useDispatch();
    const getMessageKeys = useSyncedMessageKeys();
    const showConfirmModal = useShowConfirmModal();

    const onUpdateAttachment = (ID: string, attachment: DecryptResultPmcrypto) => {
        dispatch(updateAttachment({ ID, attachment }));
    };

    return useCallback(
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
                    getAttachment
                );
            } else {
                download = await formatDownload(attachment, message.verification, outsideKey, onUpdateAttachment, api);
            }

            if (download.isError || download.verified === VERIFICATION_STATUS.SIGNED_AND_INVALID) {
                const handleError = async () => {
                    await showConfirmModal([download]);
                    await generateDownload(download);
                };

                void handleError();
            }

            return download;
        },
        [api]
    );
};
