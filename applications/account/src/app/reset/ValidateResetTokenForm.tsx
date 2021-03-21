import { c } from 'ttag';
import React, { useEffect, useRef } from 'react';
import {
    FormField,
    Button,
    InputTwo,
    RequestNewCodeModal,
    useFormErrors,
    useLoading,
    useModals,
    ConfirmModal,
} from 'react-components';
import { ResetPasswordSetters, ResetPasswordState } from 'react-components/containers/resetPassword/useResetPassword';
import { BRAND_NAME } from 'proton-shared/lib/constants';
import { requiredValidator } from 'proton-shared/lib/helpers/formValidators';
import ButtonSpacer from '../public/ButtonSpacer';
import TextSpacer from '../public/TextSpacer';

interface Props {
    onSubmit: () => Promise<void>;
    state: ResetPasswordState;
    setters: ResetPasswordSetters;
    onBack: () => void;
    onRequest: () => Promise<void>;
}

const ValidateResetTokenForm = ({ onSubmit, state, setters: stateSetters, onBack, onRequest }: Props) => {
    const [loading, withLoading] = useLoading();
    const { createModal } = useModals();
    const hasModal = useRef<boolean>(false);
    const { email, phone, token } = state;

    const { validator, onFormSubmit } = useFormErrors();

    useEffect(() => {
        // Reset token value when moving to this step again. Do something better.
        stateSetters.token('');
    }, []);

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
        return onSubmit();
    };

    const subTitle = email
        ? c('Info')
              .t`Enter the code that was sent to ${email}. If you can't find the message in your inbox, please check your spam folder.`
        : c('Info').t`Enter the code sent to your phone number ${phone}.`;

    return (
        <form
            className="signup-form"
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
            <TextSpacer>{subTitle}</TextSpacer>
            <FormField id="reset-token" bigger label={c('Label').t`Code`} error={validator([requiredValidator(token)])}>
                <InputTwo disableChange={loading} value={token} onValue={stateSetters.token} autoFocus />
            </FormField>
            <ButtonSpacer>
                <Button size="large" color="norm" type="submit" fullWidth loading={loading}>{c('Action')
                    .t`Reset password`}</Button>
            </ButtonSpacer>
            {email || phone ? (
                <ButtonSpacer mode="secondary">
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
                                        method: email ? 'email' : 'sms',
                                        value: email || 'phone',
                                    }}
                                    onEdit={onBack}
                                    onResend={onRequest}
                                    email={email}
                                    phone={phone}
                                />
                            )
                        }
                    >{c('Action').t`Didn't receive a code?`}</Button>
                </ButtonSpacer>
            ) : null}
        </form>
    );
};

export default ValidateResetTokenForm;
