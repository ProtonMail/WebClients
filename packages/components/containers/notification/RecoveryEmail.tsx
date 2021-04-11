import React, { useState } from 'react';
import { c } from 'ttag';
import { updateEmail } from 'proton-shared/lib/api/settings';
import { emailValidator, requiredValidator } from 'proton-shared/lib/helpers/formValidators';

import { Alert, Button, ConfirmModal, InputFieldTwo, useFormErrors } from '../../components';
import { useLoading, useModals, useNotifications, useEventManager } from '../../hooks';
import AuthModal from '../password/AuthModal';

import './RecoveryEmail.scss';

interface Props {
    email: string | null;
    hasReset: boolean;
    hasNotify: boolean;
}

const RecoveryEmail = ({ email, hasReset, hasNotify }: Props) => {
    const [input, setInput] = useState(email);
    const [loading, withLoading] = useLoading();
    const { createNotification } = useNotifications();
    const { createModal } = useModals();
    const { call } = useEventManager();
    const { validator, onFormSubmit } = useFormErrors();

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
            className="recovery-email_container"
            onSubmit={(e) => {
                e.preventDefault();
                if (onFormSubmit()) {
                    withLoading(submit());
                }
            }}
        >
            <div className="text-ellipsis mr1" title={email || ''}>
                <InputFieldTwo
                    type="email"
                    autoComplete="email"
                    id="recovery-email-input"
                    className="recovery-email_email-input"
                    value={input || ''}
                    placeholder={c('Info').t`Not set`}
                    error={validator([requiredValidator(input), emailValidator(input || '')])}
                    onValue={setInput}
                />
            </div>
            <div>
                <Button type="submit" color="norm" disabled={email === input} loading={loading}>
                    {c('Action').t`Update`}
                </Button>
            </div>
        </form>
    );
};

export default RecoveryEmail;
