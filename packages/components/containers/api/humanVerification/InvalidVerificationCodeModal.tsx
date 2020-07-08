import React from 'react';
import { ConfirmModal, Button, PrimaryButton, Alert } from '../../../index';
import { c } from 'ttag';

interface Props {
    edit?: string;
    request?: string;
    onEdit: () => void;
    onResend: () => void;
    onClose?: () => void;
}
const InvalidVerificationCodeModal = ({
    onEdit,
    onResend,
    edit = c('Action').t`Try another method`,
    request = c('Action').t`Request new code`,
    ...rest
}: Props) => {
    return (
        <ConfirmModal
            title={c('Title').t`Invalid verification code`}
            confirm={
                <>
                    <Button
                        className="mr1"
                        onClick={() => {
                            rest.onClose?.();
                            onEdit();
                        }}
                    >
                        {edit}
                    </Button>
                    <PrimaryButton
                        onClick={() => {
                            rest.onClose?.();
                            onResend();
                        }}
                    >
                        {request}
                    </PrimaryButton>
                </>
            }
            {...rest}
        >
            <Alert type="error">
                {c('Info')
                    .t`Would you like to receive a new verification code or use an alternative verification method?`}
            </Alert>
        </ConfirmModal>
    );
};

export default InvalidVerificationCodeModal;
