import React from 'react';
import { c } from 'ttag';
import { FormModal } from '../../../components';
import { useLoading } from '../../../hooks';

interface Props {
    edit?: string;
    request?: string;
    onEdit: () => void;
    onResend: () => Promise<void>;
    onClose?: () => void;
}

const InvalidVerificationCodeModal = ({
    onEdit,
    onResend,
    edit = c('Action').t`Try another method`,
    request = c('Action').t`Request new code`,
    ...rest
}: Props) => {
    const [loading, withLoading] = useLoading();
    return (
        <FormModal
            loading={loading}
            title={c('Title').t`Invalid verification code`}
            small
            mode="alert"
            onSubmit={async () => {
                await withLoading(onResend());
                rest.onClose?.();
            }}
            submit={request}
            onClose={() => {
                rest.onClose?.();
                onEdit();
            }}
            close={edit}
            closeProps={{
                onClick: () => {
                    rest.onClose?.();
                    onEdit();
                },
            }}
            {...rest}
        >
            {c('Info').t`Would you like to receive a new verification code or use an alternative verification method?`}
        </FormModal>
    );
};

export default InvalidVerificationCodeModal;
