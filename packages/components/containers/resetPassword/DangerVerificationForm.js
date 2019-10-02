import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Input, Alert, PrimaryButton, Href, useConfig } from 'react-components';
import { c } from 'ttag';
import { CLIENT_TYPES } from 'proton-shared/lib/constants';

const { VPN } = CLIENT_TYPES;

const DangerVerificationForm = ({ onSubmit }) => {
    const [value, updateValue] = useState('');
    const WORD = 'DANGER';
    const { CLIENT_TYPE } = useConfig();
    const loginLink = <Href key="0" url="https://mail.protonmail.com/login">{c('Link').t`here`}</Href>;

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();

                if (value !== WORD) {
                    return;
                }
                onSubmit();
            }}
        >
            <Alert
                type="warning"
                learnMore="https://protonmail.com/support/knowledge-base/updating-your-login-password/"
            >{c('Info')
                .jt`Resetting your password will reset your encryption keys for all Proton related services (Mail and VPN). You will be unable to read your existing messages. If you know your ProtonMail credentials, do NOT reset. You can log in with them ${loginLink}.`}</Alert>
            <Alert type="warning">{c('Info').t`ALL YOUR DATA WILL BE LOST!`}</Alert>
            <div className="mb1">
                <Input
                    placeholder={c('Placeholder').t`Enter the word '${WORD}' here`}
                    value={value}
                    pattern={WORD}
                    onChange={({ target }) => updateValue(target.value)}
                    error={value.length > 0 && value !== WORD ? c('Error').t`Please enter '${WORD}'` : ''}
                    required
                />
            </div>
            {CLIENT_TYPE === VPN ? null : (
                <Alert learnMore="https://protonmail.com/support/knowledge-base/restoring-encrypted-mailbox/">{c('Info')
                    .t`If you remember your old password later, you can recover your existing messages.`}</Alert>
            )}
            <div className="alignright mb1">
                <PrimaryButton type="submit">{c('Action').t`Reset my password`}</PrimaryButton>
            </div>
        </form>
    );
};

DangerVerificationForm.propTypes = {
    onSubmit: PropTypes.func.isRequired
};

export default DangerVerificationForm;
