import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { SubTitle, useNotifications } from 'react-components';
import { FORM } from 'proton-shared/lib/authentication/loginReducer';

import LoginForm from './LoginForm';
import TOTPForm from './TOTPForm';
import UnlockForm from './UnlockForm';
import useLogin from './useLogin';

const getErrorText = (error) => {
    if (error.name === 'PasswordError') {
        return c('Error').t('Incorrect decryption password');
    }
    if (error.data && error.data.Error) {
        return error.data.Error;
    }
    return error.message;
};

const LoginContainer = ({ onLogin, ignoreUnlock }) => {
    const { form, error, loading, handleLoginSubmit, handleTotpSubmit, handleUnlockSubmit } = useLogin({
        onLogin,
        ignoreUnlock
    });
    const { createNotification } = useNotifications();

    const formComponent = (() => {
        if (form === FORM.LOGIN) {
            return <LoginForm loading={loading} onSubmit={handleLoginSubmit} />;
        }

        if (form === FORM.TOTP) {
            return <TOTPForm loading={loading} onSubmit={handleTotpSubmit} />;
        }

        if (form === FORM.UNLOCK) {
            return <UnlockForm loading={loading} onSubmit={handleUnlockSubmit} />;
        }

        throw new Error('Unsupported form');
    })();

    useEffect(() => {
        if (!error) {
            return;
        }
        const text = getErrorText(error);
        createNotification({ type: 'error', text });
    }, [error]);

    const text = c('Login').t`User login`;
    return (
        <div className="mauto w400e mw100 p2 bordered-container flex-item-noshrink">
            <SubTitle>{text}</SubTitle>
            {formComponent}
        </div>
    );
};

LoginContainer.propTypes = {
    onLogin: PropTypes.func.isRequired,
    ignoreUnlock: PropTypes.bool
};

LoginContainer.defaultProps = {
    ignoreUnlock: false
};

export default LoginContainer;
