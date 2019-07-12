import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useApi } from 'react-components';
import { PASSWORD_WRONG_ERROR } from 'proton-shared/lib/api/auth';
import { srpAuth } from 'proton-shared/lib/srp';
import AskAuthModal from './AskAuthModal';

const AuthModal = ({ onClose, onSuccess, config, ...rest }) => {
    const api = useApi();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async ({ password, totp }) => {
        try {
            setLoading(true);

            await srpAuth({
                api,
                credentials: { password, totp },
                config
            });

            onSuccess();
            onClose();
        } catch (error) {
            const { data: { Code, Error } = {} } = error;
            if (Code === PASSWORD_WRONG_ERROR) {
                setError(Error);
            }
            setLoading(false);
        }
    };

    return <AskAuthModal onSubmit={handleSubmit} onClose={onClose} loading={loading} error={error} {...rest} />;
};

AuthModal.propTypes = {
    onClose: PropTypes.func,
    onSuccess: PropTypes.func.isRequired,
    config: PropTypes.object.isRequired
};

export default AuthModal;
