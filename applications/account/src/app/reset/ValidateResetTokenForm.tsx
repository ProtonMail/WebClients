import { c } from 'ttag';
import React, { useRef, useState } from 'react';
import {
    Button,
    RequestNewCodeModal,
    useFormErrors,
    useLoading,
    useModals,
    ConfirmModal,
    InputFieldTwo,
} from '@proton/components';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import { RecoveryMethod } from '@proton/components/containers/resetPassword/interface';

interface Props {
    onSubmit: (token: string) => Promise<void>;
    onBack: () => void;
    onRequest: () => Promise<void>;
    method: RecoveryMethod;
    value: string;
}

const ValidateResetTokenForm = ({ onSubmit, onBack, onRequest, method, value }: Props) => {
    const [loading, withLoading] = useLoading();
    const { createModal } = useModals();
    const hasModal = useRef<boolean>(false);
    const [token, setToken] = useState('');

    const { validator, onFormSubmit } = useFormErrors();

    const handleSubmit = async () => {
        await new Promise<void>((resolve, reject) => {
            const loseAllData = (
                <span className="text-bold">{c('Info').t`lose access to all current encrypted data`}</span>
            );
            createModal(
                <ConfirmModal
                    title={c('Title').t`Warning!`}
                    confirm={c('Action').t`Reset password`}
                    onConfirm={resolve}
                    onClose={reject}
                    mode="alert"
                    submitProps={{
                        color: 'danger',
                    }}
                >
                    <div>
                        <p className="mt0">{c('Info')
                            .jt`You will ${loseAllData} in your ${BRAND_NAME} Account. To restore it, you will need to enter your old password.`}</p>
                        <p className="mt0">{c('Info')
                            .t`This will also disable any two-factor authentication method associated with this account.`}</p>
                        <p className="mt0 mb0">{c('Info').t`Continue anyway?`}</p>
                    </div>
                </ConfirmModal>
            );
        });
        return onSubmit(token);
    };

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

                if (hasModal.current) {
                    return;
                }

                hasModal.current = true;
                withLoading(
                    handleSubmit()
                        .then(() => {
                            hasModal.current = false;
                        })
                        .catch(() => {
                            hasModal.current = false;
                        })
                );
            }}
        >
            <div className="mb1-75">{subTitle}</div>
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
            {method === 'sms' || method === 'email' ? (
                <Button
                    size="large"
                    color="norm"
                    shape="ghost"
                    type="button"
                    fullWidth
                    disabled={loading}
                    onClick={() =>
                        createModal(
                            <RequestNewCodeModal
                                verificationModel={{
                                    method,
                                    value,
                                }}
                                onEdit={onBack}
                                onResend={onRequest}
                            />
                        )
                    }
                    className="mt0-5"
                >{c('Action').t`Didn't receive a code?`}</Button>
            ) : null}
        </form>
    );
};

export default ValidateResetTokenForm;
