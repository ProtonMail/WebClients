import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { PrimaryButton, IntlTelInput } from 'react-components';
import { c } from 'ttag';

const VerificationPhoneInput = ({ onSendClick, loading }) => {
    const [phone, setPhone] = useState('');

    const handleChangePhone = (status, value, countryData, number) => {
        setPhone(number);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSendClick(phone);
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="mb1">
                <IntlTelInput
                    containerClassName="w100"
                    inputClassName="w100"
                    onPhoneNumberChange={handleChangePhone}
                    onPhoneNumberBlur={handleChangePhone}
                />
            </div>
            <div>
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
