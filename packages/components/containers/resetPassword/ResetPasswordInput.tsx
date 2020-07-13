import React from 'react';
import { c } from 'ttag';
import { EmailInput } from '../../index';

interface Props {
    value: string;
    setValue: (email: string) => void;
    id: string;
}
const ResetPasswordInput = ({ value, setValue, id }: Props) => {
    return (
        <EmailInput
            name="email"
            autoCapitalize="off"
            autoCorrect="off"
            id={id}
            placeholder={c('Placeholder').t`Recovery email`}
            value={value}
            onChange={({ target: { value } }) => setValue(value)}
            required
        />
    );
};

export default ResetPasswordInput;
