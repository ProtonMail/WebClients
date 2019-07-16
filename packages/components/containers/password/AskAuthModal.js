import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { FormModal, PasswordTotpInputs, useUserSettings } from 'react-components';

const AskAuthModal = ({ onClose, onSubmit, error, hideTotp, ...rest }) => {
    const [password, setPassword] = useState('');
    const [totp, setTotp] = useState('');
    const [{ '2FA': { Enabled } } = {}] = useUserSettings();

    const showTotp = !hideTotp && !!Enabled;

    return (
        <FormModal
            onClose={onClose}
            onSubmit={() => onSubmit({ password, totp })}
            title={c('Title').t`Sign in again to continue`}
            close={c('Label').t`Cancel`}
            submit={c('Label').t`Submit`}
            error={error}
            small
            {...rest}
        >
            <PasswordTotpInputs
                password={password}
                setPassword={setPassword}
                passwordError={error}
                totp={totp}
                setTotp={setTotp}
                totpError={error}
                showTotp={showTotp}
            />
        </FormModal>
    );
};

AskAuthModal.propTypes = {
    onClose: PropTypes.func,
    onSubmit: PropTypes.func.isRequired,
    error: PropTypes.string,
    hideTotp: PropTypes.bool
};

export default AskAuthModal;
