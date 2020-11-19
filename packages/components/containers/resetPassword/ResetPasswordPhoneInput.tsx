import React from 'react';
import { IntlTelInput } from '../../components';

interface Props {
    value: string;
    setValue: (phone: string) => void;
    id: string;
    placeholder?: string;
}
const ResetPasswordPhoneInput = ({ value, setValue, id, placeholder }: Props) => {
    return (
        <IntlTelInput
            name="phone"
            id={id}
            autoFocus
            defaultValue={value}
            containerClassName="w100"
            inputClassName="w100"
            dropdownContainer="body"
            onPhoneNumberChange={(_status: any, _value: any, _countryData: any, number: string) => setValue(number)}
            placeholder={placeholder}
            required
        />
    );
};

export default ResetPasswordPhoneInput;
