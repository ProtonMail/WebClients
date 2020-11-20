import React, { useState } from 'react';
import { c } from 'ttag';
import { updateEmail } from 'proton-shared/lib/api/settings';

import { FormModal, ConfirmModal, Alert, Row, Label, EmailInput, Field } from '../../components';
import { useLoading, useModals, useNotifications, useEventManager } from '../../hooks';
import AuthModal from '../password/AuthModal';

interface Props {
    email: string;
    hasReset: boolean;
    hasNotify: boolean;
    onClose?: () => void;
}

const EmailModal = ({ email, hasReset, hasNotify, onClose, ...rest }: Props) => {
    const [input, setInput] = useState(email);
    const [loading, withLoading] = useLoading();
    const { createNotification } = useNotifications();
    const { createModal } = useModals();
    const { call } = useEventManager();

    const handleChange = ({ target }: React.ChangeEvent<HTMLInputElement>) => setInput(target.value);

    const handleSubmit = async () => {
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
        onClose?.();
    };

    return (
        <FormModal
            loading={loading}
            onClose={onClose}
            onSubmit={() => withLoading(handleSubmit())}
            title={c('Title').t`Update recovery/notification email`}
            {...rest}
        >
            <Row>
                <Label htmlFor="emailInput">{c('Label').t`Email`}</Label>
                <Field>
                    <EmailInput id="emailInput" value={input} onChange={handleChange} autoFocus />
                </Field>
            </Row>
        </FormModal>
    );
};

export default EmailModal;
