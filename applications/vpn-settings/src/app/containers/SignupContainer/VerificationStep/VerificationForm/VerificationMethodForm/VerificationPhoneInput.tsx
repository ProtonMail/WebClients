import React, { useState } from 'react';
import { PrimaryButton, InputFieldTwo, PhoneInput, useFormErrors } from 'react-components';
import { c } from 'ttag';
import { requiredValidator } from 'proton-shared/lib/helpers/formValidators';

interface Props {
    loading?: boolean;
    onSendClick: (phone: string) => void;
    defaultCountry?: string;
}

const VerificationPhoneInput = ({ onSendClick, loading, defaultCountry }: Props) => {
    const [phone, setPhone] = useState('');
    const { validator, onFormSubmit } = useFormErrors();

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                if (onFormSubmit()) {
                    onSendClick(phone);
                }
            }}
        >
            <div className="mb1">
                <InputFieldTwo
                    id="recovery-phone"
                    as={PhoneInput}
                    error={validator([requiredValidator(phone)])}
                    disableChange={loading}
                    autoFocus
                    value={phone}
                    onChange={setPhone}
                    defaultCountry={defaultCountry}
                />
            </div>
            <div>
                <PrimaryButton type="submit" disabled={!phone} loading={loading}>{c('Action').t`Send`}</PrimaryButton>
            </div>
        </form>
    );
};

export default VerificationPhoneInput;
