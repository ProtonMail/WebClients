import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';
import { c } from 'ttag';
import { Link } from 'react-router-dom';
import { useApi, useLoading } from 'react-components';
import { requestLoginResetToken, validateResetToken } from 'proton-shared/lib/api/reset';

import SignInLayout from '../components/layout/SignInLayout';
import ResetPasswordForm from '../components/form/ResetPasswordForm';
import ValidateResetTokenForm from '../components/form/ValidateResetTokenForm';
import DangerVerificationForm from '../components/form/DangerVerificationForm';
import NewPasswordForm from '../components/form/NewPasswordForm';

const REQUEST_RESET_TOKEN_STEP = 0;
const VALIDATE_RESET_TOKEN_STEP = 1;
const DANGER_VERIFICATION_STEP = 2;
const NEW_PASSWORD_STEP = 3;

const ResetPasswordContainer = ({ history }) => {
    const [step, updateStep] = useState(REQUEST_RESET_TOKEN_STEP);
    const [username, updateUsername] = useState('');
    const api = useApi();
    const [loading, withLoading] = useLoading();

    const handleSubmit = async (data) => {
        if (step === REQUEST_RESET_TOKEN_STEP) {
            // data is email
            await api(requestLoginResetToken({ Username: username, NotificationEmail: data }));
            updateStep(VALIDATE_RESET_TOKEN_STEP);
        }

        if (step === VALIDATE_RESET_TOKEN_STEP) {
            // data is token
            await api(validateResetToken(username, data));
            updateStep(DANGER_VERIFICATION_STEP);
        }

        if (step === DANGER_VERIFICATION_STEP) {
            updateStep(NEW_PASSWORD_STEP);
        }

        if (step === NEW_PASSWORD_STEP) {
            await api(); // TODO
            history.push('/login');
        }
    };

    return (
        <SignInLayout title={c('Title').t`Reset password`}>
            {step === REQUEST_RESET_TOKEN_STEP ? (
                <ResetPasswordForm
                    username={username}
                    updateUsername={updateUsername}
                    onSubmit={(data) => withLoading(handleSubmit(data))}
                    loading={loading}
                />
            ) : null}
            {step === VALIDATE_RESET_TOKEN_STEP ? (
                <ValidateResetTokenForm onSubmit={(data) => withLoading(handleSubmit(data))} loading={loading} />
            ) : null}
            {step === DANGER_VERIFICATION_STEP ? <DangerVerificationForm onSubmit={handleSubmit} /> : null}
            {step === NEW_PASSWORD_STEP ? (
                <NewPasswordForm onSubmit={(data) => withLoading(handleSubmit(data))} loading={loading} />
            ) : null}
            <div className="flex flex-nowrap flex-spacebetween">
                <Link to="/login">{c('Link').t`Back to login`}</Link>
                <Link to="/forgot-username">{c('Link').t`Forgot username?`}</Link>
            </div>
        </SignInLayout>
    );
};

ResetPasswordContainer.propTypes = {
    history: PropTypes.object.isRequired
};

export default withRouter(ResetPasswordContainer);
