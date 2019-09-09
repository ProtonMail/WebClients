import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { PrimaryButton, TelInput } from 'react-components';
import { c } from 'ttag';

const VerificationPhoneInput = ({ onSendClick, loading }) => {
    const [phone, setPhone] = useState('');

    const handleChangePhone = ({ target }) => setPhone(target.value);
    const handleSubmit = (e) => {
        e.preventDefault();
        onSendClick(phone);
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="mt2 pt0-75">
                <TelInput value={phone} onChange={handleChangePhone} placeholder="(201) 555-0123" />
            </div>
            <div className="mt1 flex flex-justify-end">
                <PrimaryButton type="submit" disabled={!phone} loading={loading}>{c('Action').t`Send`}</PrimaryButton>
            </div>
        </form>
    );
};

VerificationPhoneInput.propTypes = {
    onSendClick: PropTypes.func.isRequired,
    loading: PropTypes.bool
};

export default VerificationPhoneInput;
