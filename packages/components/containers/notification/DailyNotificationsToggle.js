import React from 'react';
import PropTypes from 'prop-types';
import { Toggle, useToggle, useUserSettings, useApiWithoutResult, useEventManager } from 'react-components';

const DailyNotificationsToggle = ({ id }) => {
    const { call } = useEventManager();
    const [{ Email }] = useUserSettings();
    const { request, loading } = useApiWithoutResult(); // TODO add API config
    const { state, toggle } = useToggle(!!Email.Notify);

    const handleChange = async ({ target }) => {
        await request(+target.checked);
        await call();
        toggle();
    };

    return <Toggle disabled={loading} checked={state} id={id} onChange={handleChange} />;
};

DailyNotificationsToggle.propTypes = {
    id: PropTypes.string
};

export default DailyNotificationsToggle;
