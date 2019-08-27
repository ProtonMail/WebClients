import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Input, Alert, PrimaryButton } from 'react-components';
import { c } from 'ttag';

const DangerVerificationForm = ({ onSubmit }) => {
    const [value, updateValue] = useState('');
    const WORD = 'DANGER';

    return (
        <form onSubmit={onSubmit}>
            <Alert
                type="warning"
                learnMore="https://protonmail.com/support/knowledge-base/updating-your-login-password/"
            >{c('Info')
                .t`Resetting your password will reset your encryption keys for all Proton related services (Mail and VPN). You will be unable to read your existing messages. If you know your ProtonMail credentials, do NOT reset. You can log in with them here.`}</Alert>
            <Alert type="warning">{c('Info').t`ALL YOUR DATA WILL BE LOST!`}</Alert>
            <div className="mb1">
                <Input
                    placeholder={c('Placeholder').t`Enter the word '${WORD}' here`}
                    value={value}
                    pattern={WORD}
                    onChange={({ target }) => updateValue(target.value)}
                    required
                />
            </div>
            <Alert learnMore="https://protonmail.com/support/knowledge-base/restoring-encrypted-mailbox/">{c('Info')
                .t`If you remember your old password later, you can recover your existing messages.`}</Alert>
            <div className="mb1">
                <PrimaryButton type="submit">{c('Action').t`Reset my password`}</PrimaryButton>
            </div>
        </form>
    );
};

DangerVerificationForm.propTypes = {
    onSubmit: PropTypes.func.isRequired
};

export default DangerVerificationForm;
