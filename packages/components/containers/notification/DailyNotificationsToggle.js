import React from 'react';
import PropTypes from 'prop-types';
import { Toggle, useLoading, useUserSettings, useApi, useEventManager } from 'react-components';
import { updateNotifyEmail } from 'proton-shared/lib/api/settings';

const DailyNotificationsToggle = ({ id }) => {
    const { call } = useEventManager();
    const api = useApi();
    const [{ Email }] = useUserSettings();
    const [loading, withLoading] = useLoading();

    const handleChange = async (checked) => {
        await api(updateNotifyEmail(checked));
        await call();
    };

    return (
        <Toggle
            loading={loading}
            checked={!!Email.Notify}
            id={id}
            onChange={({ target: { checked } }) => withLoading(handleChange(+checked))}
        />
    );
};

DailyNotificationsToggle.propTypes = {
    id: PropTypes.string
};

export default DailyNotificationsToggle;
