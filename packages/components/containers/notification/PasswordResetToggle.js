import React from 'react';
import PropTypes from 'prop-types';
import { AuthModal, Toggle, useModals, useLoading, useUserSettings, useEventManager } from 'react-components';
import { updateResetEmail } from 'proton-shared/lib/api/settings';

const PasswordResetToggle = ({ id }) => {
    const [{ Email }] = useUserSettings();
    const [loading, withLoading] = useLoading();
    const { createModal } = useModals();
    const { call } = useEventManager();

    const handleChange = async (checked) => {
        await new Promise((resolve, reject) => {
            createModal(
                <AuthModal onClose={reject} onSuccess={resolve} config={updateResetEmail({ Reset: checked })} />
            );
        });
        await call();
    };

    return (
        <Toggle
            loading={loading}
            checked={!!Email.Reset}
            id={id}
            onChange={({ target: { checked } }) => withLoading(handleChange(+checked))}
        />
    );
};

PasswordResetToggle.propTypes = {
    id: PropTypes.string
};

export default PasswordResetToggle;
