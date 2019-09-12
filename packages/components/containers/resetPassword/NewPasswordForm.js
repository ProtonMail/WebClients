import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { PasswordInput, Alert, PrimaryButton } from 'react-components';
import { c } from 'ttag';

const NewPasswordForm = ({ onSubmit, loading }) => {
    const [password, updatePassword] = useState('');
    const [confirmPassword, updateConfirmPassword] = useState('');

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();

                if (password !== confirmPassword) {
                    return;
                }

                onSubmit(password);
            }}
        >
            <Alert type="warning">{c('Info').t`Keep this password safe, it cannot be recovered.`}</Alert>
            <div className="mb1">
                <PasswordInput
                    autoFocus
                    value={password}
                    placeholder={c('Placeholder').t`Choose a new password`}
                    onChange={({ target }) => updatePassword(target.value)}
                    required
                />
            </div>
            <div className="alignright mb1">
                <PasswordInput
                    value={confirmPassword}
                    placeholder={c('Password').t`Confirm new password`}
                    onChange={({ target }) => updateConfirmPassword(target.value)}
                    error={password !== confirmPassword ? c('Error').t`Passwords do not match` : undefined}
                    required
                />
            </div>
            <Alert type="warning">{c('Info')
                .t`Do NOT forget this password. If you forget it, you will not be able to login or decrypt your messages.`}</Alert>
            <div className="mb1">
                <PrimaryButton loading={loading} type="submit">{c('Action').t`Submit`}</PrimaryButton>
            </div>
        </form>
    );
};

NewPasswordForm.propTypes = {
    onSubmit: PropTypes.func.isRequired,
    loading: PropTypes.bool
};

export default NewPasswordForm;
