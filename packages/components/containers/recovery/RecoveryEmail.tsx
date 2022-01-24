import { useState } from 'react';
import { c } from 'ttag';
import { updateEmail } from '@proton/shared/lib/api/settings';
import { postVerifySend } from '@proton/shared/lib/api/verify';
import { emailValidator } from '@proton/shared/lib/helpers/formValidators';
import isTruthy from '@proton/shared/lib/helpers/isTruthy';
import { SETTINGS_STATUS, UserSettings } from '@proton/shared/lib/interfaces';

import { Alert, AlertModal, Button, ConfirmModal, Icon, InputFieldTwo, useFormErrors } from '../../components';
import { useApi, useLoading, useModals, useNotifications, useEventManager } from '../../hooks';
import { classnames } from '../../helpers';
import AuthModal from '../password/AuthModal';

interface Props {
    email: UserSettings['Email'];
    hasReset: boolean;
    hasNotify: boolean;
    className?: string;
}

const RecoveryEmail = ({ email, hasReset, hasNotify, className }: Props) => {
    const [input, setInput] = useState(email.Value || '');
    const [verifyModalOpen, setVerifyModalOpen] = useState(false);
    const [loadingSubmit, withLoadingSubmit] = useLoading();
    const [loadingVerifySend, withLoadingVerifySend] = useLoading();
    const { createNotification } = useNotifications();
    const { createModal } = useModals();
    const { call } = useEventManager();
    const { validator, onFormSubmit } = useFormErrors();
    const api = useApi();

    const handleSendVerificationEmailClick = () => {
        withLoadingVerifySend(
            api(postVerifySend({ Type: 'recovery_email' }))
                .then(() => {
                    createNotification({
                        type: 'success',
                        text: c('Recovery Email').t`Verification email sent to ${email.Value}`,
                    });
                })
                .finally(() => {
                    setVerifyModalOpen(false);
                })
        );
    };

    const submit = async () => {
        if (!input && (hasReset || hasNotify)) {
            await new Promise<void>((resolve, reject) => {
                createModal(
                    <ConfirmModal title={c('Title').t`Confirm address`} onConfirm={resolve} onClose={reject}>
                        <Alert type="warning">
                            {hasReset &&
                                !hasNotify &&
                                c('Warning')
                                    .t`By deleting this address, you will no longer be able to recover your account.`}
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
                            {c('Warning').t`Are you sure you want to delete the address?`}
                        </Alert>
                    </ConfirmModal>
                );
            });
        }

        await new Promise((resolve, reject) => {
            createModal(<AuthModal onClose={reject} onSuccess={resolve} config={updateEmail({ Email: input })} />);
        });

        await call();

        createNotification({ text: c('Success').t`Email updated` });
    };

    return (
        <form
            className={classnames(['flex flex-wrap on-mobile-flex-column', className])}
            onSubmit={(e) => {
                e.preventDefault();
                if (onFormSubmit()) {
                    void withLoadingSubmit(submit());
                }
            }}
        >
            <AlertModal
                open={verifyModalOpen}
                title={c('Recovery Email').t`Verify recovery email?`}
                buttons={[
                    <Button
                        loading={loadingVerifySend}
                        shape="solid"
                        color="norm"
                        onClick={handleSendVerificationEmailClick}
                    >{c('Recovery Email').t`Send verification email`}</Button>,
                    <Button onClick={() => setVerifyModalOpen(false)} disabled={loadingVerifySend}>{c('Recovery Email')
                        .t`Cancel`}</Button>,
                ]}
            >
                {c('Recovery Email')
                    .t`Verifying your email address increases your account security and allows additional options for recovery.`}
            </AlertModal>
            <div className="mr1 mb1 on-mobile-mr0 flex-item-fluid min-w14e" title={email.Value || ''}>
                <InputFieldTwo
                    type="email"
                    autoComplete="email"
                    id="recovery-email-input"
                    disableChange={loadingSubmit}
                    value={input || ''}
                    placeholder={c('Info').t`Not set`}
                    error={validator([input && emailValidator(input)].filter(isTruthy))}
                    onValue={setInput}
                    assistiveText={
                        email.Status === SETTINGS_STATUS.UNVERIFIED ? (
                            <span className="flex flex-align-items-center">
                                <Icon className="color-danger aligntop mr0-25" name="circle-exclamation-filled" />
                                <span className="color-norm mr0-5">{c('Recovery Email')
                                    .t`Email address not yet verified.`}</span>
                                <Button shape="link" color="norm" onClick={() => setVerifyModalOpen(true)}>{c(
                                    'Recovery Email'
                                ).t`Verify now`}</Button>
                            </span>
                        ) : (
                            <span className="flex flex-align-items-center">
                                <Icon className="color-success aligntop mr0-25" name="circle-check-filled" />
                                <span className="mr0-5">{c('Recovery Email').t`Email address has been verified.`}</span>
                            </span>
                        )
                    }
                />
            </div>
            <div className="mb0-5">
                <Button
                    type="submit"
                    shape="outline"
                    disabled={(email.Value || '') === input}
                    loading={loadingSubmit}
                    data-testid="account:recovery:emailSubmit"
                >
                    {c('Action').t`Save`}
                </Button>
            </div>
        </form>
    );
};

export default RecoveryEmail;
