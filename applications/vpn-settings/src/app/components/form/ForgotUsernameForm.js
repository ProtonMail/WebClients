import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { EmailInput, Alert, PrimaryButton } from 'react-components';

const ForgotUsernameForm = ({ onSubmit, loading }) => {
    const [email, updateEmail] = useState('');

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                onSubmit(email);
            }}
        >
            <div className="mb1">
                <EmailInput
                    name="email"
                    autoFocus
                    autoCapitalize="off"
                    autoCorrect="off"
                    id="email"
                    placeholder={c('Placeholder').t`Email`}
                    value={email}
                    onChange={({ target }) => updateEmail(target.value)}
                    required
                />
            </div>
            <Alert>{c('Info')
                .t`Enter your email address (notification / recovery email) and we will send you your username(s). Your account recovery email. It is usually the email you provided during signup`}</Alert>
            <div className="mb1">
                <PrimaryButton loading={loading} type="submit">{c('Action').t`Email me my username(s)`}</PrimaryButton>
            </div>
        </form>
    );
};

ForgotUsernameForm.propTypes = {
    onSubmit: PropTypes.func.isRequired,
    loading: PropTypes.bool
};

export default ForgotUsernameForm;
