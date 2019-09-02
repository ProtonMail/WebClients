import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import {
    Input,
    EmailInput,
    Alert,
    PrimaryButton,
    ConfirmModal,
    useModals,
    useLoading,
    useConfig
} from 'react-components';
import { CLIENT_TYPES } from 'proton-shared/lib/constants';

const { VPN } = CLIENT_TYPES;

const RequestResetTokenForm = ({ username, setUsername, onSubmit, loading }) => {
    const { createModal } = useModals();
    const [loadingConfirm, withLoadingConfirm] = useLoading();
    const [email, setEmail] = useState('');
    const { CLIENT_TYPE } = useConfig();

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
        <form onSubmit={(e) => withLoadingConfirm(handleSubmit(e))}>
            <Alert
                learnMore={
                    CLIENT_TYPE === VPN
                        ? 'https://protonvpn.com/support/reset-protonvpn-account-password/'
                        : 'https://protonmail.com/support/knowledge-base/set-forgot-password-options/'
                }
            >{c('Info').t`We will send a reset code to your recovery email to reset your password.`}</Alert>
            <div className="mb1">
                <Input
                    name="username"
                    autoFocus
                    autoCapitalize="off"
                    autoCorrect="off"
                    id="username"
                    placeholder={c('Placeholder').t`Username`}
                    value={username}
                    onChange={({ target: { value } }) => setUsername(value)}
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
                    onChange={({ target: { value } }) => setEmail(value)}
                    required
                />
            </div>
            <div className="flex flex-nowrap flex-spacebetween mb1">
                <Link to="/login">{c('Link').t`Back to login`}</Link>
                <PrimaryButton loading={loading || loadingConfirm} type="submit">{c('Action')
                    .t`Get a new password`}</PrimaryButton>
            </div>
        </form>
    );
};

RequestResetTokenForm.propTypes = {
    onSubmit: PropTypes.func.isRequired,
    loading: PropTypes.bool,
    username: PropTypes.string,
    setUsername: PropTypes.func.isRequired
};

export default RequestResetTokenForm;
