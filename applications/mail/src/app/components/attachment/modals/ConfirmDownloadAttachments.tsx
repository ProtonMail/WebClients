import { c, msgid } from 'ttag';

import { AlertModal, Button, Href, ModalProps, PrimaryButton } from '@proton/components';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { VERIFICATION_STATUS } from '@proton/shared/lib/mail/constants';

import { Download } from '../../../helpers/attachment/attachmentDownloader';

interface Props extends ModalProps {
    downloads: Download[];
    onResolve: () => void;
    onReject: () => void;
}

const ConfirmDownloadAttachments = ({ downloads, onResolve, onReject, ...rest }: Props) => {
    const total = downloads.length;
    const senderVerificationFailed = downloads.some(
        ({ verified }) => verified === VERIFICATION_STATUS.SIGNED_AND_INVALID
    );

    const title = senderVerificationFailed ? c('Title').t`Verification error` : c('Title').t`Decryption error`;

    const learnMore = senderVerificationFailed ? getKnowledgeBaseUrl('/digital-signature') : undefined;

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

    return (
        <AlertModal
            title={title}
            buttons={[
                <PrimaryButton onClick={onResolve}>{c('Action').t`Download`}</PrimaryButton>,
                <Button onClick={onReject}>{c('Action').t`Cancel`}</Button>,
            ]}
            {...rest}
        >
            {warningContent}
            <br />
            <Href href={learnMore}>{c('Link').t`Learn more`}</Href>
            <br />
            {c('Info').ngettext(
                msgid`Do you want to download this attachment anyway?`,
                `Do you want to download these attachments anyway?`,
                total
            )}
        </AlertModal>
    );
};

export default ConfirmDownloadAttachments;
