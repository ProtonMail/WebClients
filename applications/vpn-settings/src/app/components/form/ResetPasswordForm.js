import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { Input, EmailInput, Alert, PrimaryButton, ConfirmModal, useModals } from 'react-components';

const ResetPasswordForm = ({ username, updateUsername, onSubmit, loading }) => {
    const { createModal } = useModals();
    const [email, updateEmail] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        await new Promise((resolve, reject) => {
            createModal(
                <ConfirmModal title={c('Title').t`Confirm reset password`} onConfirm={resolve} onClose={reject}>
                    <Alert type="warning">{c('Info')
                        .t`Resetting your password means your old password and the places it is saved will no longer work. Are you sure you want to reset your password?`}</Alert>
                </ConfirmModal>
            );
        });
        onSubmit(email);
    };

    return (
        <form onSubmit={handleSubmit}>
            <Alert learnMore="https://protonmail.com/support/knowledge-base/set-forgot-password-options/">{c('Info')
                .t`We will send a reset code to your recovery email to reset your password.`}</Alert>
            <div className="mb1">
                <Input
                    name="username"
                    autoFocus
                    autoCapitalize="off"
                    autoCorrect="off"
                    id="username"
                    placeholder={c('Placeholder').t`Username`}
                    value={username}
                    onChange={({ target }) => updateUsername(target.value)}
                    required
                />
            </div>
            <div className="mb1">
                <EmailInput
                    name="email"
                    autoCapitalize="off"
                    autoCorrect="off"
                    id="email"
                    placeholder={c('Placeholder').t`Recovery email`}
                    value={email}
                    onChange={({ target }) => updateEmail(target.value)}
                    required
                />
            </div>
            <div className="mb1">
                <PrimaryButton loading={loading} type="submit">{c('Action').t`Get a new password`}</PrimaryButton>
            </div>
        </form>
    );
};

ResetPasswordForm.propTypes = {
    onSubmit: PropTypes.func.isRequired,
    loading: PropTypes.bool,
    username: PropTypes.string,
    updateUsername: PropTypes.func.isRequired
};

export default ResetPasswordForm;
