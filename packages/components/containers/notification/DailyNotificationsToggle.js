import React, { onEffect } from 'react';
import PropTypes from 'prop-types';
import { Toggle, useToggle, useSettings } from 'react-components';

const DailyNotificationsToggle = ({ id }) => {
    const { Email } = useSettings();
    const { state, toggle } = useToggle(!!Email.Notify);

    onEffect(() => {
        // TODO call API
    }, [state]);

    return <Toggle checked={state} id={id} onChange={toggle} />;
};

DailyNotificationsToggle.propTypes = {
    id: PropTypes.string
};

export default DailyNotificationsToggle;
