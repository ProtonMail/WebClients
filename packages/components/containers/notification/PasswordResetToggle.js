import React from 'react';
import PropTypes from 'prop-types';
import { Toggle, useToggle, useUserSettings } from 'react-components';

const PasswordResetToggle = ({ id }) => {
    const [{ Email }] = useUserSettings();
    const { state, toggle } = useToggle(!!Email.Reset);

    const handleChange = async () => {
        // await TODO call API
        toggle();
    };

    return <Toggle checked={state} id={id} onChange={handleChange} />;
};

PasswordResetToggle.propTypes = {
    id: PropTypes.string
};

export default PasswordResetToggle;
