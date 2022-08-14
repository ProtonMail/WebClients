import { useState } from 'react';

import { c } from 'ttag';

import { Button, InputFieldTwo, RequestNewCodeModal, useFormErrors, useLoading } from '@proton/components';
import { RecoveryMethod } from '@proton/components/containers/resetPassword/interface';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import noop from '@proton/utils/noop';

import Text from '../public/Text';
import ValidateResetTokenConfirmModal from './ValidateResetTokenConfirmModal';

interface Props {
    onSubmit: (token: string) => Promise<void>;
    onBack: () => void;
    onRequest: () => Promise<void>;
    method: RecoveryMethod;
    value: string;
}

const ValidateResetTokenForm = ({ onSubmit, onBack, onRequest, method, value }: Props) => {
    const [loading, withLoading] = useLoading();
    const [confirmModal, setConfirmModal] = useState(false);
    const [newCodeModal, setNewCodeModal] = useState(false);
    const [token, setToken] = useState('');

    const { validator, onFormSubmit } = useFormErrors();

    // To not break translations
    const email = value;
    const phone = value;
    const subTitle =
        method === 'email'
            ? c('Info')
                  .t`Enter the code that was sent to ${email}. If you can't find the message in your inbox, please check your spam folder.`
            : c('Info').t`Enter the code sent to your phone number ${phone}.`;

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                if (loading || !onFormSubmit()) {
                    return;
                }
                setConfirmModal(true);
            }}
        >
            <ValidateResetTokenConfirmModal
                onClose={() => setConfirmModal(false)}
                onConfirm={() => {
                    withLoading(onSubmit(token)).catch(noop);
                }}
                open={confirmModal}
            />
            {(method === 'sms' || method === 'email') && (
                <RequestNewCodeModal
                    verificationModel={{
                        method,
                        value,
                    }}
                    onClose={() => setNewCodeModal(false)}
                    open={newCodeModal}
                    onEdit={onBack}
                    onResend={onRequest}
                />
            )}
            <Text>{subTitle}</Text>
            <InputFieldTwo
                id="reset-token"
                bigger
                label={c('Label').t`Code`}
                error={validator([requiredValidator(token)])}
                disableChange={loading}
                value={token}
                onValue={setToken}
                autoFocus
            />
            <Button size="large" color="norm" type="submit" fullWidth loading={loading} className="mt1-75">{c('Action')
                .t`Reset password`}</Button>
            {(method === 'sms' || method === 'email') && (
                <Button
                    size="large"
                    color="norm"
                    shape="ghost"
                    type="button"
                    fullWidth
                    disabled={loading}
                    onClick={() => setNewCodeModal(true)}
                    className="mt0-5"
                >{c('Action').t`Didn't receive a code?`}</Button>
            )}
        </form>
    );
};

export default ValidateResetTokenForm;
