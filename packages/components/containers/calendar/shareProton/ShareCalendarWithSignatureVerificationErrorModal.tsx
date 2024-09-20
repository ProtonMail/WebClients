import { c } from 'ttag';

import { Button, Href } from '@proton/atoms';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import Modal from '@proton/components/components/modalTwo/Modal';
import ModalContent from '@proton/components/components/modalTwo/ModalContent';
import ModalFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalHeader from '@proton/components/components/modalTwo/ModalHeader';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

interface Props extends ModalProps {
    senderEmail: string;
    onCancel: () => void;
}

const ShareCalendarWithSignatureVerificationErrors = ({ senderEmail, onCancel, ...rest }: Props) => {
    const boldSenderEmail = (
        <span key="bold-sender-email" className="text-bold text-break">
            {senderEmail}
        </span>
    );

    const handleCancel = () => {
        onCancel();
        rest.onClose?.();
    };

    return (
        <Modal {...rest} size="medium">
            <ModalHeader
                title={c('Signature verification error when joining calendar').t`Signature verification error`}
                hasClose={false}
            />
            <ModalContent>
                <p>
                    {c('Signature verification error when joining calendar')
                        .jt`You have enabled address verification for ${boldSenderEmail}. We couldn't verify the authenticity of this calendar invite. This may be due to changes in the encryption keys of this contact. Please review its advanced PGP settings, or your can ask ${boldSenderEmail} for a new invite.`}
                </p>
                <Href href={getKnowledgeBaseUrl('/key-pinning')}>{c('Link').t`Learn more`}</Href>
            </ModalContent>
            <ModalFooter className="justify-end">
                <Button onClick={handleCancel}>{c('Action').t`Cancel`}</Button>
            </ModalFooter>
        </Modal>
    );
};

export default ShareCalendarWithSignatureVerificationErrors;
