import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { PrimaryButton, EmailInput } from 'react-components';
import { c } from 'ttag';

const VerificationEmailInput = ({ defaultEmail = '', onSendClick, loading }) => {
    const [email, setEmail] = useState(defaultEmail);

    const handleChange = ({ target }) => setEmail(target.value);
    const handleSubmit = (e) => {
        e.preventDefault();
        onSendClick(email);
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="mb1">
                <EmailInput value={email} onChange={handleChange} placeholder={c('Placeholder').t`Email`} />
            </div>
            <div>
                <PrimaryButton type="submit" disabled={!email} loading={loading}>{c('Action').t`Send`}</PrimaryButton>
            </div>
        </form>
    );
};

VerificationEmailInput.propTypes = {
    onSendClick: PropTypes.func.isRequired,
    defaultEmail: PropTypes.string,
    loading: PropTypes.bool
};

export default VerificationEmailInput;
