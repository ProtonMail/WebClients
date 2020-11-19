import React from 'react';
import { c } from 'ttag';
import { Input } from '../../components';

interface Props {
    id: string;
    value: string;
    setValue: (token: string) => void;
    placeholder?: string;
}
const ResetTokenInput = ({ id, value, setValue, placeholder = c('Placeholder').t`Reset code` }: Props) => {
    return (
        <Input
            value={value}
            onChange={({ target }) => setValue(target.value)}
            name="resetToken"
            id={id}
            placeholder={placeholder}
            autoFocus
            required
        />
    );
};

export default ResetTokenInput;
