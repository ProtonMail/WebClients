import { c } from 'ttag';

import { Button } from '@proton/atoms';
import Alert from '@proton/components/components/alert/Alert';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import Modal from '@proton/components/components/modalTwo/Modal';
import ModalContent from '@proton/components/components/modalTwo/ModalContent';
import ModalFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalHeader from '@proton/components/components/modalTwo/ModalHeader';

interface Props extends ModalProps {
    onConfirm: () => void;
}

const ConfirmRemovePhoneModal = ({ onConfirm, onClose, ...rest }: Props) => {
    return (
        <Modal onClose={onClose} {...rest}>
            <ModalHeader title={c('Title').t`Confirm phone number`} />
            <ModalContent>
                <Alert type="warning">
                    {c('Warning').t`By deleting this phone number, you will no longer be able to recover your account.`}
                    <br />
                    <br />
                    {c('Warning').t`Are you sure you want to delete the phone number?`}
                </Alert>
            </ModalContent>
            <ModalFooter>
                <Button onClick={onClose}>{c('Action').t`Cancel`}</Button>
                <Button
                    color="norm"
                    onClick={() => {
                        onConfirm();
                        onClose?.();
                    }}
                >
                    {c('Action').t`Confirm`}
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default ConfirmRemovePhoneModal;
