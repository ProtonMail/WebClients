import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
    Toggle,
    useToggle,
    useUserSettings,
    AskPasswordModal,
    useApi,
    useModals,
    useEventManager
} from 'react-components';
import { updateNotifyEmail } from 'proton-shared/lib/api/settings';
import { srpAuth } from 'proton-shared/lib/srp';

const DailyNotificationsToggle = ({ id }) => {
    const api = useApi();
    const { call } = useEventManager();
    const [{ Email }] = useUserSettings();
    const { createModal } = useModals();
    const { state, toggle } = useToggle(!!Email.Notify);
    const [loading, setLoading] = useState(false);

    const handleChange = async ({ target }) => {
        try {
            setLoading(true);
            const { password, totp } = await new Promise((resolve, reject) => {
                createModal(<AskPasswordModal onClose={reject} onSubmit={resolve} />);
            });
            await srpAuth({
                api,
                credentials: { password, totp },
                config: updateNotifyEmail({ Notify: +target.checked })
            });
            await call();
            toggle();
            setLoading(false);
        } catch (error) {
            setLoading(false);
            throw error;
        }
    };

    return <Toggle loading={loading} checked={state} id={id} onChange={handleChange} />;
};

DailyNotificationsToggle.propTypes = {
    id: PropTypes.string
};

export default DailyNotificationsToggle;
