import React, { useState } from 'react';
import { c } from 'ttag';
import { updateEmail } from 'proton-shared/lib/api/settings';
import { emailValidator } from 'proton-shared/lib/helpers/formValidators';
import isTruthy from 'proton-shared/lib/helpers/isTruthy';

import { Alert, Button, ConfirmModal, InputFieldTwo, useFormErrors } from '../../components';
import { useLoading, useModals, useNotifications, useEventManager } from '../../hooks';
import AuthModal from '../password/AuthModal';

import { classnames } from '../../helpers';

interface Props {
    email: string | null;
    hasReset: boolean;
    hasNotify: boolean;
    className?: string;
}

const RecoveryEmail = ({ email, hasReset, hasNotify, className }: Props) => {
    const [input, setInput] = useState(email || '');
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
            className={classnames(['flex flex-wrap on-mobile-flex-column', className])}
            onSubmit={(e) => {
                e.preventDefault();
                if (onFormSubmit()) {
                    withLoading(submit());
                }
            }}
        >
            <div className="mr1 on-mobile-mr0 flex-item-fluid min-w14e" title={email || ''}>
                <InputFieldTwo
                    type="email"
                    autoComplete="email"
                    id="recovery-email-input"
                    disableChange={loading}
                    value={input || ''}
                    placeholder={c('Info').t`Not set`}
                    error={validator([input && emailValidator(input)].filter(isTruthy))}
                    onValue={setInput}
                />
            </div>
            <div className="mb0-5">
                <Button type="submit" color="norm" disabled={(email || '') === input} loading={loading}>
                    {c('Action').t`Update`}
                </Button>
            </div>
        </form>
    );
};

export default RecoveryEmail;
