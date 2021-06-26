import React from 'react';
import { c } from 'ttag';
import { EmailInput } from '../../components';

interface Props {
    value: string;
    setValue: (email: string) => void;
    id: string;
    placeholder?: string;
}
const ResetPasswordEmailInput = ({ value, setValue, id, placeholder = c('Placeholder').t`Recovery email` }: Props) => {
    return (
        <EmailInput
            name="email"
            autoCapitalize="off"
            autoCorrect="off"
            autoFocus
            id={id}
            placeholder={placeholder}
            value={value}
            onChange={({ target: { value } }) => setValue(value)}
            required
        />
    );
};

export default ResetPasswordEmailInput;
