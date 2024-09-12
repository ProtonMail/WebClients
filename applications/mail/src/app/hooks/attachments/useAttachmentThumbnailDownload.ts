import { useModalTwo } from '@proton/components';
import { useApi, useGetVerificationPreferences } from '@proton/components/hooks';
import type { WorkerDecryptionResult } from '@proton/crypto';
import { bigIntToNumber } from '@proton/crypto/lib/bigInteger';
import { getAttachment as getAttachmentRequest, getAttachmentsMetadata } from '@proton/shared/lib/api/attachments';
import type { AttachmentFullMetadata, AttachmentsMetadata } from '@proton/shared/lib/interfaces/mail/Message';
import { MESSAGE_FLAGS, VERIFICATION_STATUS } from '@proton/shared/lib/mail/constants';
import { getSessionKey } from '@proton/shared/lib/mail/send/attachments';

import ConfirmDownloadAttachments from 'proton-mail/components/attachment/modals/ConfirmDownloadAttachments';
import type { Download } from 'proton-mail/helpers/attachment/attachmentDownloader';
import { generateDownload } from 'proton-mail/helpers/attachment/attachmentDownloader';
import { decryptAndVerify, getVerificationStatusFromKeys } from 'proton-mail/helpers/attachment/attachmentLoader';
import { useGetAttachment } from 'proton-mail/hooks/attachments/useAttachment';
import { useContactsMap } from 'proton-mail/hooks/contact/useContacts';
import { useGetMessageKeys } from 'proton-mail/hooks/message/useGetMessageKeys';
import { updateAttachment } from 'proton-mail/store/attachments/attachmentsActions';
import { useMailDispatch } from 'proton-mail/store/hooks';

const enum DOWNLOAD_TYPE {
    PREVIEW = 'PREVIEW',
    DOWNLOAD = 'DOWNLOAD',
}
/**
 * This hook has some similarities with useDownload and usePreview hooks, but download logic using attachment metadata is quite different.
 * For now, it's difficult to merge them, but the old download part needs a rework.
 * When this rework will be done, we might be able to refactor these hooks to merge them.
 */
export const useAttachmentThumbnailDownload = () => {
    const api = useApi();
    const getAttachment = useGetAttachment();
    const getMessageKeys = useGetMessageKeys();
    const dispatch = useMailDispatch();
    const [confirmDownloadModal, handleShowModal] = useModalTwo(ConfirmDownloadAttachments);
    const getVerificationPreferences = useGetVerificationPreferences();
    const contactsMap = useContactsMap();

    const downloadAttachment = async (type: DOWNLOAD_TYPE, attachmentsMetadata: AttachmentsMetadata) => {
        let download: Download;
        let attachment: WorkerDecryptionResult<Uint8Array>;
        const { ID } = attachmentsMetadata;

        const attachmentInState = getAttachment(ID);

        try {
            if (attachmentInState) {
                download = {
                    // Add MIMEType and Name so that we can build the file when user wants to download the file
                    attachment: {
                        ...attachmentInState,
                        MIMEType: attachmentsMetadata.MIMEType,
                        Name: attachmentsMetadata.Name,
                    },
                    data: attachmentInState.data,
                    // If attachment is in state, we already verified it during download process
                    // So if we open the attachment using Redux state, we should see the same verifications (e.g. modals are displayed in case of SIGNED_AND_INVALID)
                    verified: attachmentInState.verified,
                };
                attachment = attachmentInState;
            } else {
                /* API Calls to get
                 * 1 - Attachment encrypted data
                 * 2 - Attachment metadata (signature, keyPackets etc...)
                 */
                const [apiEncryptedBinary, apiAttachmentFullMetadata] = await Promise.all([
                    api(getAttachmentRequest(ID)),
                    api<{ Attachment: AttachmentFullMetadata }>(getAttachmentsMetadata(ID)),
                ]);

                const { AddressID, KeyPackets, Signature, /*EncSignature,*/ Sender, IsAutoForwardee } =
                    apiAttachmentFullMetadata.Attachment;

                if (!Sender) {
                    throw new Error(`Cannot decrypt attachment, sender is missing`);
                }

                const messageKeys = await getMessageKeys({ AddressID });

                const messageFlagsForAutoForwarding = bigIntToNumber(MESSAGE_FLAGS.FLAG_AUTO_FORWARDEE);
                const sessionKey = await getSessionKey(
                    { KeyPackets },
                    messageKeys.privateKeys,
                    IsAutoForwardee ? messageFlagsForAutoForwarding : undefined
                );

                // Verify API keys and get pinned keys if there are some
                const verificationPreferences = await getVerificationPreferences({
                    email: Sender.Address,
                    lifetime: 0,
                    contactEmailsMap: contactsMap,
                });

                const decryptedAttachment = await decryptAndVerify(
                    apiEncryptedBinary,
                    sessionKey,
                    Signature,
                    verificationPreferences.verifyingKeys
                    // EncSignature TODO uncomment when fixed
                );

                const verified = getVerificationStatusFromKeys(
                    decryptedAttachment,
                    verificationPreferences.verifyingKeys
                );

                // Set verified state in the attachment to keep track of it in Redux
                attachment = {
                    ...decryptedAttachment,
                    verified,
                } as WorkerDecryptionResult<Uint8Array>;

                download = {
                    // Add MIMEType and Name so that we can build the file when user wants to download the file
                    attachment: {
                        ...attachment,
                        MIMEType: attachmentsMetadata.MIMEType,
                        Name: attachmentsMetadata.Name,
                        Size: attachmentsMetadata.Size,
                    },
                    data: decryptedAttachment.data,
                    verified,
                };
            }

            dispatch(updateAttachment({ ID, attachment }));
        } catch (error: any) {
            if (type === DOWNLOAD_TYPE.PREVIEW) {
                // When previewing, if an error occurs while decrypting, remove loading state and show a "not supported preview" text
                download = {
                    attachment: {
                        // Overriding mime type to prevent opening any visualizer with empty data, especially needed for pdfs
                        MIMEType: '',
                        Name: attachmentsMetadata.Name,
                        Size: attachmentsMetadata.Size,
                    },
                    data: new Uint8Array([]),
                    verified: VERIFICATION_STATUS.NOT_VERIFIED,
                };
            } else {
                // When downloading, if an error occurs while decrypting, download the encrypted version
                download = {
                    attachment: {
                        Name: `${attachmentsMetadata.Name}.pgp`,
                        Size: attachmentsMetadata.Size,
                        MIMEType: 'application/pgp-encrypted',
                        ID: attachmentsMetadata.ID,
                    },
                    data: error.binary,
                    verified: VERIFICATION_STATUS.NOT_VERIFIED,
                };
            }
        }

        return download;
    };

    const handleThumbnailPreview = async (attachmentsMetadata: AttachmentsMetadata) => {
        const download = await downloadAttachment(DOWNLOAD_TYPE.PREVIEW, attachmentsMetadata);

        if (download.isError || download.verified === VERIFICATION_STATUS.SIGNED_AND_INVALID) {
            const handleError = async () => {
                await handleShowModal({ downloads: [download] });
                await generateDownload(download);
            };

            void handleError();
        }

        return download;
    };

    const handleThumbnailDownload = async (attachmentsMetadata: AttachmentsMetadata) => {
        const download = await downloadAttachment(DOWNLOAD_TYPE.DOWNLOAD, attachmentsMetadata);

        if (download.isError || download.verified === VERIFICATION_STATUS.SIGNED_AND_INVALID) {
            await handleShowModal({ downloads: [download] });
        }

        await generateDownload(download);
        return download.verified;
    };

    return { handleThumbnailPreview, handleThumbnailDownload, confirmDownloadModal };
};
