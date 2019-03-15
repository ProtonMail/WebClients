import React, { onEffect } from 'react';
import PropTypes from 'prop-types';
import { Toggle, useToggle, useSettings } from 'react-components';

const PasswordResetToggle = ({ id }) => {
    const { Email } = useSettings();
    const { state, toggle } = useToggle(!!Email.Reset);

    onEffect(() => {
        // TODO call API
    }, [state]);

    return <Toggle checked={state} id={id} onChange={toggle} />;
};

PasswordResetToggle.propTypes = {
    id: PropTypes.string
};

export default PasswordResetToggle;
