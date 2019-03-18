import React from 'react';
import PropTypes from 'prop-types';
import { Toggle, useToggle, useSettings, useApiWithoutResult } from 'react-components';

const DailyNotificationsToggle = ({ id }) => {
    const { Email } = useSettings();
    const { request, loading } = useApiWithoutResult(); // TODO add API config
    const { state, toggle } = useToggle(!!Email.Notify);

    const handleChange = ({ target }) => {
        toggle();
        request(target.checked);
    };

    return <Toggle disabled={loading} checked={state} id={id} onChange={handleChange} />;
};

DailyNotificationsToggle.propTypes = {
    id: PropTypes.string
};

export default DailyNotificationsToggle;
