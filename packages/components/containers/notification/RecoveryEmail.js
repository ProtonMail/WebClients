import React, { useState } from 'react';
import { c } from 'ttag';
import {
    PrimaryButton,
    InputModal,
    Field,
    AskPasswordModal,
    useModals,
    useApi,
    useUserSettings,
    useEventManager,
    useNotifications
} from 'react-components';
import { updateEmail } from 'proton-shared/lib/api/settings';
import { srpAuth } from 'proton-shared/lib/srp';

const RecoveryEmail = () => {
    const api = useApi();
    const { createModal } = useModals();
    const { call } = useEventManager();
    const [{ Email } = {}] = useUserSettings();
    const { createNotification } = useNotifications();
    const [email, setEmail] = useState(Email.Value);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (newEmail) => {
        try {
            setLoading(true);
            const { password, totp } = await new Promise((resolve, reject) => {
                createModal(<AskPasswordModal onClose={reject} onSubmit={resolve} />);
            });
            await srpAuth({
                api,
                credentials: { password, totp },
                config: updateEmail({ Email: newEmail })
            });
            await call();
            setEmail(newEmail);
            close();
            createNotification({ text: c('Success').t`Email updated` });
        } catch (error) {
            setLoading(false);
        }
    };

    const open = () => {
        createModal(
            <InputModal
                loading={loading}
                input={email}
                title={c('Title').t`Update reset/notification email`}
                label={c('Label').t`Email`}
                placeholder="name@domain.com"
                onSubmit={handleSubmit}
            />
        );
    };

    return (
        <Field>
            {email}
            <PrimaryButton disabled={loading} onClick={open}>{c('Action').t`Edit`}</PrimaryButton>
        </Field>
    );
};

export default RecoveryEmail;
