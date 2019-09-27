import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { ResetPasswordForm, SignInLayout } from 'react-components';

const ResetPasswordContainer = ({ onLogin }) => {
    return (
        <SignInLayout title={c('Title').t`Log in`}>
            <h2>{c('Title').t`Reset password`}</h2>
            <ResetPasswordForm onLogin={onLogin} />
        </SignInLayout>
    );
};

ResetPasswordContainer.propTypes = {
    onLogin: PropTypes.func.isRequired
};

export default ResetPasswordContainer;
