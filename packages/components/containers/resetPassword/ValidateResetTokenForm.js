import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { Input, Alert, PrimaryButton } from 'react-components';

const ValidateResetTokenForm = ({ onSubmit, loading, token, setToken }) => {
    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                onSubmit();
            }}
        >
            <Alert>{c('Info')
                .t`We've sent a reset code to your recovery email, valid for one hour or until you request a new code. Enter it below to continue.`}</Alert>
            <div className="mb1">
                <Input
                    value={token}
                    onChange={({ target }) => setToken(target.value)}
                    id="resetToken"
                    name="resetToken"
                    autoFocus
                    required
                    placeholder={c('Placeholder').t`Reset code`}
                />
            </div>
            <Alert type="warning">{c('Info')
                .t`IMPORTANT: Do not close or navigate away from this page. You will need to enter the reset code into the field below once you receive it.`}</Alert>
            <div className="alignright mb1">
                <PrimaryButton loading={loading} type="submit">{c('Action').t`Reset password`}</PrimaryButton>
            </div>
        </form>
    );
};

ValidateResetTokenForm.propTypes = {
    onSubmit: PropTypes.func.isRequired,
    token: PropTypes.string.isRequired,
    setToken: PropTypes.func.isRequired,
    loading: PropTypes.bool
};

export default ValidateResetTokenForm;
