import { c } from 'ttag';

import { Button } from '@proton/atoms';
import Alert from '@proton/components/components/alert/Alert';

import type { ModalProps } from '../../../components';
import {
    ModalTwo as Modal,
    ModalTwoContent as ModalContent,
    ModalTwoFooter as ModalFooter,
    ModalTwoHeader as ModalHeader,
} from '../../../components';

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
