import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
    Toggle,
    useToggle,
    useUserSettings,
    AskPasswordModal,
    useApi,
    usePrompts,
    useEventManager
} from 'react-components';
import { updateResetEmail } from 'proton-shared/lib/api/settings';
import { srpAuth } from 'proton-shared/lib/srp';

const PasswordResetToggle = ({ id }) => {
    const api = useApi();
    const { call } = useEventManager();
    const [{ Email }] = useUserSettings();
    const { createPrompt } = usePrompts();
    const { state, toggle } = useToggle(!!Email.Reset);
    const [loading, setLoading] = useState(false);

    const handleChange = async ({ target }) => {
        try {
            setLoading(true);
            const { password, totp } = await createPrompt((resolve, reject) => (
                <AskPasswordModal onClose={reject} onSubmit={resolve} />
            ));
            await srpAuth({
                api,
                credentials: { password, totp },
                config: updateResetEmail({ Reset: +target.checked })
            });
            await call();
            toggle();
            setLoading(false);
        } catch (error) {
            setLoading(false);
        }
    };

    return <Toggle disabled={loading} checked={state} id={id} onChange={handleChange} />;
};

PasswordResetToggle.propTypes = {
    id: PropTypes.string
};

export default PasswordResetToggle;
