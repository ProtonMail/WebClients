import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
    AuthModal,
    FormModal,
    ConfirmModal,
    Alert,
    Row,
    Label,
    Input,
    Field,
    useApi,
    useLoading,
    useModals,
    useNotifications,
    useEventManager
} from 'react-components';
import { c } from 'ttag';
import { updateEmail, updateNotifyEmail, updateResetEmail } from 'proton-shared/lib/api/settings';
import { srpAuth } from 'proton-shared/lib/srp';

const EmailModal = ({ email, hasReset, hasNotify, onClose, ...rest }) => {
    const [input, setInput] = useState(email);
    const [loading, withLoading] = useLoading();
    const { createNotification } = useNotifications();
    const { createModal } = useModals();
    const { call } = useEventManager();
    const api = useApi();

    const handleChange = ({ target }) => setInput(target.value);

    const handleSubmit = async () => {
        if (!input && (hasReset || hasNotify)) {
            await new Promise((resolve, reject) => {
                createModal(
                    <ConfirmModal onConfirm={resolve} onClose={reject}>
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

        const credentials = await new Promise((resolve, reject) => {
            createModal(<AuthModal onClose={reject} onSuccess={resolve} config={updateEmail({ Email: input })} />);
        });

        if (!input) {
            hasReset && (await srpAuth({ api, credentials, config: updateResetEmail(0) }));
            hasNotify && (await api(updateNotifyEmail(0)));
        }

        await call();
        createNotification({ text: c('Success').t`Email updated` });
        onClose();
    };

    return (
        <FormModal
            loading={loading}
            onClose={onClose}
            onSubmit={() => withLoading(handleSubmit())}
            title={c('Title').t`Update recovery/notification email`}
            small
            {...rest}
        >
            <Row>
                <Label htmlFor="emailInput">{c('Label').t`Email`}</Label>
                <Field>
                    <Input
                        id="emailInput"
                        value={input}
                        placeholder="name@domain.com"
                        onChange={handleChange}
                        autoFocus={true}
                    />
                </Field>
            </Row>
        </FormModal>
    );
};

EmailModal.propTypes = {
    email: PropTypes.string,
    hasReset: PropTypes.bool,
    hasNotify: PropTypes.bool,
    onClose: PropTypes.func
};

export default EmailModal;
