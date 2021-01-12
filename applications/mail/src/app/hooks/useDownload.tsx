import { Attachment } from 'proton-shared/lib/interfaces/mail/Message';
import { VERIFICATION_STATUS } from 'proton-shared/lib/mail/constants';
import { getAttachments } from 'proton-shared/lib/mail/messages';
import React, { useCallback } from 'react';
import { Alert, ConfirmModal, useApi, useModals } from 'react-components';
import { c, msgid } from 'ttag';
import { useAttachmentCache } from '../containers/AttachmentProvider';
import { useMessageCache } from '../containers/MessageProvider';
import {
    Download,
    formatDownload,
    formatDownloadAll,
    generateDownload,
    generateDownloadAll,
} from '../helpers/attachment/attachmentDownloader';
import { MessageExtendedWithData } from '../models/message';
import { useGetMessageKeys } from './message/useGetMessageKeys';

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
                        <Alert type="warning" learnMore={learnMore}>
                            {warningContent}
                        </Alert>
                        <Alert>
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
    const messageCache = useMessageCache();
    const getMessageKeys = useGetMessageKeys();

    return (localID: string) => {
        const messageFromCache = messageCache.get(localID) as MessageExtendedWithData;
        return getMessageKeys(messageFromCache.data);
    };
};

export const useDownload = () => {
    const api = useApi();
    const cache = useAttachmentCache();
    const showConfirmModal = useShowConfirmModal();
    const getMessageKeys = useSyncedMessageKeys();

    return useCallback(
        async (message: MessageExtendedWithData, attachment: Attachment) => {
            const messageKeys = await getMessageKeys(message.localID);
            const download = await formatDownload(attachment, message.verification, messageKeys, cache, api);

            if (download.isError || download.verified === VERIFICATION_STATUS.SIGNED_AND_INVALID) {
                await showConfirmModal([download]);
            }

            await generateDownload(download);
            return download.verified;
        },
        [api, cache]
    );
};

export const useDownloadAll = () => {
    const api = useApi();
    const cache = useAttachmentCache();
    const showConfirmModal = useShowConfirmModal();
    const getMessageKeys = useSyncedMessageKeys();

    return useCallback(
        async (message: MessageExtendedWithData) => {
            const messageKeys = await getMessageKeys(message.localID);
            const attachments = getAttachments(message.data);
            const list = await formatDownloadAll(attachments, message.verification, messageKeys, cache, api);
            const isError = list.some(({ isError }) => isError);
            const senderVerificationFailed = list.some(
                ({ verified }) => verified === VERIFICATION_STATUS.SIGNED_AND_INVALID
            );

            if (isError || senderVerificationFailed) {
                await showConfirmModal(list);
            }

            await generateDownloadAll(message.data, list);
        },
        [api, cache]
    );
};

export const usePreview = () => {
    const api = useApi();
    const cache = useAttachmentCache();
    const getMessageKeys = useSyncedMessageKeys();
    const showConfirmModal = useShowConfirmModal();

    return useCallback(
        async (message: MessageExtendedWithData, attachment: Attachment) => {
            const messageKeys = await getMessageKeys(message.localID);
            const download = await formatDownload(attachment, message.verification, messageKeys, cache, api);

            if (download.isError || download.verified === VERIFICATION_STATUS.SIGNED_AND_INVALID) {
                await showConfirmModal([download]);
            }

            return download;
        },
        [api, cache]
    );
};
