import React, { useState } from 'react';
import { c } from 'ttag';
import {
    PrimaryButton,
    InputModal,
    Field,
    AskPasswordModal,
    useModal,
    useApi,
    useUserSettings,
    useEventManager,
    useNotifications,
    usePrompts
} from 'react-components';
import { updateEmail } from 'proton-shared/lib/api/settings';
import { srpAuth } from 'proton-shared/lib/srp';

const RecoveryEmail = () => {
    const api = useApi();
    const { isOpen, open, close } = useModal();
    const { createPrompt } = usePrompts();
    const { call } = useEventManager();
    const [{ Email } = {}] = useUserSettings();
    const { createNotification } = useNotifications();
    const [email, setEmail] = useState(Email.Value);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (newEmail) => {
        try {
            setLoading(true);
            const { password, totp } = await createPrompt((resolve, reject) => (
                <AskPasswordModal onClose={reject} onSubmit={resolve} />
            ));
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

    return (
        <Field>
            {email}
            <PrimaryButton disabled={loading} onClick={open}>{c('Action').t`Edit`}</PrimaryButton>
            {isOpen ? (
                <InputModal
                    loading={loading}
                    input={email}
                    title={c('Title').t`Update reset/notification email`}
                    label={c('Label').t`Email`}
                    placeholder="name@domain.com"
                    onSubmit={handleSubmit}
                    onClose={close}
                />
            ) : null}
        </Field>
    );
};

export default RecoveryEmail;
