import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { PasswordInput, Alert, PrimaryButton } from 'react-components';
import { c } from 'ttag';

const NewPasswordForm = ({ onSubmit, loading }) => {
    const [password, updatePassword] = useState('');

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                onSubmit(password);
            }}
        >
            <PasswordInput
                className="w100 mb1"
                value={password}
                placeholder={c('Placeholder').t`Choose a new password`}
                onChange={({ target }) => updatePassword(target.value)}
                required
            />
            <PasswordInput
                className="w100 mb1"
                placeholder={c('Password').t`Confirm new password`}
                pattern={password}
                required
            />
            <Alert>{c('Info').t`Save your password somewhere safe.`}</Alert>
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
