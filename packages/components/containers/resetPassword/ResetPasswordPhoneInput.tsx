import React from 'react';
import { IntlTelInput } from '../../components';

interface Props {
    value: string;
    setValue: (phone: string) => void;
    id: string;
}
const ResetPasswordPhoneInput = ({ value, setValue, id }: Props) => {
    return (
        <IntlTelInput
            name="phone"
            id={id}
            autoFocus={true}
            defaultValue={value}
            containerClassName="w100"
            inputClassName="w100"
            dropdownContainer="body"
            onPhoneNumberChange={(_status: any, _value: any, _countryData: any, number: string) => setValue(number)}
            required
        />
    );
};

export default ResetPasswordPhoneInput;
