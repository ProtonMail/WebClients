import { Attachment } from 'proton-shared/lib/interfaces/mail/Message';
import { VERIFICATION_STATUS } from 'proton-shared/lib/mail/constants';
import React, { useCallback } from 'react';
import { Alert, ConfirmModal, useApi, useModals } from 'react-components';
import { c, msgid } from 'ttag';
import { useAttachmentCache } from '../containers/AttachmentProvider';
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

export const useDownload = () => {
    const api = useApi();
    const cache = useAttachmentCache();
    const showConfirmModal = useShowConfirmModal();
    const getMessageKeys = useGetMessageKeys();

    return useCallback(
        async (message: MessageExtendedWithData, attachment: Attachment) => {
            const messageKeys = await getMessageKeys(message.data);
            const download = await formatDownload(attachment, message, messageKeys, cache, api);

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
    const getMessageKeys = useGetMessageKeys();

    return useCallback(
        async (message: MessageExtendedWithData) => {
            const messageKeys = await getMessageKeys(message.data);
            const list = await formatDownloadAll(message, messageKeys, cache, api);
            const isError = list.some(({ isError }) => isError);
            const senderVerificationFailed = list.some(
                ({ verified }) => verified === VERIFICATION_STATUS.SIGNED_AND_INVALID
            );

            if (isError || senderVerificationFailed) {
                await showConfirmModal(list);
            }

            await generateDownloadAll(message, list);
        },
        [api, cache]
    );
};
