import React from 'react';
import { c } from 'ttag';

import { Button, FormModal } from '../../../components';
import { useLoading } from '../../../hooks';
import { VerificationModel } from './interface';

interface Props {
    verificationModel: VerificationModel;
    onEdit: () => void;
    onResend: () => Promise<void>;

    [key: string]: any;
}

const RequestNewCodeModal = ({ verificationModel, onEdit, onResend, ...rest }: Props) => {
    const strong = <strong key="email">{verificationModel.value}</strong>;
    const [loading, withLoading] = useLoading();
    return (
        <FormModal
            title={c('Title').t`Request new verification code`}
            mode="alert"
            loading={loading}
            footer={
                <>
                    <Button
                        size="large"
                        color="norm"
                        type="button"
                        fullWidth
                        loading={loading}
                        onClick={async () => {
                            await withLoading(onResend());
                            rest.onClose?.();
                        }}
                        data-focus-fallback="-1"
                    >
                        {c('Action').t`Request new code`}
                    </Button>
                    <Button
                        size="large"
                        color="weak"
                        type="button"
                        onClick={() => {
                            rest.onClose?.();
                            onEdit();
                        }}
                        disabled={loading}
                        fullWidth
                        data-focus-fallback="-2"
                    >
                        {verificationModel.method === 'email'
                            ? c('Action').t`Edit email address`
                            : c('Action').t`Edit phone number`}
                    </Button>
                    <Button
                        size="large"
                        color="weak"
                        type="button"
                        onClick={rest.onClose}
                        disabled={loading}
                        fullWidth
                        data-focus-fallback="-3"
                    >
                        {c('Action').t`Cancel`}
                    </Button>
                </>
            }
            {...rest}
        >
            {verificationModel.method === 'email'
                ? c('Info')
                      .jt`Click "Request new code" to have a new verification code sent to ${strong}. If this email address is incorrect, click "Edit" to correct it.`
                : c('Info')
                      .jt`Click "Request new code" to have a new verification code sent to ${strong}. If this phone number is incorrect, click "Edit" to correct it.`}
        </FormModal>
    );
};

export default RequestNewCodeModal;
