import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import Prompt from '@proton/components/components/prompt/Prompt';

interface Props extends ModalProps {
    onConfirm: () => void;
}

const ConfirmRemovePhoneModal = ({ onConfirm, onClose, ...rest }: Props) => {
    return (
        <Prompt
            onClose={onClose}
            title={c('Title').t`Remove recovery phone number`}
            buttons={[
                <Button
                    color="danger"
                    onClick={() => {
                        onConfirm();
                        onClose?.();
                    }}
                >
                    {c('Action').t`Remove`}
                </Button>,
                <Button onClick={onClose}>{c('Action').t`Cancel`}</Button>,
            ]}
            {...rest}
        >
            <p>{c('Warning').t`By removing this phone number, you will no longer be able to recover your account.`}</p>
            <p>{c('Warning').t`Are you sure you want to remove your recovery phone number?`}</p>
        </Prompt>
    );
};

export default ConfirmRemovePhoneModal;
