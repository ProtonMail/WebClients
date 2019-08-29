import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { ResetPasswordForm } from 'react-components';

import SignInLayout from '../components/layout/SignInLayout';

const ResetPasswordContainer = ({ onLogin, history }) => {
    const handleLogin = (...args) => {
        history.push('/dashboard');
        onLogin(...args);
    };

    return (
        <SignInLayout title={c('Title').t`Log in`}>
            <h2>{c('Title').t`Reset password`}</h2>
            <ResetPasswordForm onLogin={handleLogin} />
        </SignInLayout>
    );
};

ResetPasswordContainer.propTypes = {
    history: PropTypes.object.isRequired,
    onLogin: PropTypes.func.isRequired
};

export default ResetPasswordContainer;
