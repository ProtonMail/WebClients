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
    hasReset: boolean;
    hasNotify: boolean;
}

const ConfirmRemoveEmailModal = ({ hasReset, hasNotify, onConfirm, onClose, ...rest }: Props) => {
    return (
        <Modal onClose={onClose} {...rest}>
            <ModalHeader title={c('Title').t`Confirm address`} />
            <ModalContent>
                <Alert type="warning">
                    {hasReset &&
                        !hasNotify &&
                        c('Warning').t`By deleting this address, you will no longer be able to recover your account.`}
                    {hasNotify &&
                        !hasReset &&
                        c('Warning')
                            .t`By deleting this address, you will no longer be able to receive daily email notifications.`}
                    {hasNotify &&
                        hasReset &&
                        c('Warning')
                            .t`By deleting this address, you will no longer be able to recover your account or receive daily email notifications.`}
                    <br />
                    <br />
                    {c('Warning').t`Are you sure you want to delete this address?`}
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

export default ConfirmRemoveEmailModal;
