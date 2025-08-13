import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms';
import Modal from '@proton/components/components/modalTwo/Modal';
import ModalContent from '@proton/components/components/modalTwo/ModalContent';
import ModalFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalHeader from '@proton/components/components/modalTwo/ModalHeader';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import { message as sanitizeMessage } from '@proton/shared/lib/sanitize';
import SettingsLink from '@proton/components/components/link/SettingsLink';

interface Props extends Omit<ModalProps, 'onClose'> {
    message: string | undefined;
    onClose: () => void;
}

const ForcePasswordChangeModal = ({ 
    message, 
    onClose,
    onExit,
    open,
    ...rest
}: Props) => {

    return (
        <Modal open={open} onClose={onClose} onExit={onExit} {...rest}>
            <ModalHeader title={c('Title').t`Account Temporarily Locked`} />
            <ModalContent>
                {message && (
                    <div className="mb-4">
                        <div dangerouslySetInnerHTML={{ __html: sanitizeMessage(message) }} />
                    </div>
                )}
            </ModalContent>
            <ModalFooter>
                <ButtonLike 
                    color="norm" 
                    className="ml-auto" 
                    as={SettingsLink} 
                    path="/account-password?action=change-password" 
                    target="_self"
                >
                    {c('Action').t`Change password`}
                </ButtonLike>
            </ModalFooter>
        </Modal>
    );
};

export default ForcePasswordChangeModal;