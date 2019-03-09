import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { SubTitle } from 'react-components';

import LoginForm from './LoginForm';
import TOTPForm from './TOTPForm';
import UnlockForm from './UnlockForm';
import useLogin from './useLogin';
import { FORM } from './loginReducer';

const LoginContainer = ({ onLogin }) => {
    const { form, loading, handleLoginSubmit, handleTotpSubmit, handleUnlockSubmit } = useLogin(onLogin);

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

    const text = c('Login').t`User login`;
    return (
        <div className="mauto w400e mw100 p2 bordered-container flex-item-noshrink">
            <SubTitle>{text}</SubTitle>
            {formComponent}
        </div>
    );
};

LoginContainer.propTypes = {
    onLogin: PropTypes.func.isRequired
};

export default LoginContainer;
