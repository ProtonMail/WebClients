import { c } from 'ttag';
import React from 'react';
import { Input } from '../../components';

interface Props {
    id: string;
    value: string;
    setValue: (token: string) => void;
}
const ResetTokenInput = ({ id, value, setValue }: Props) => {
    return (
        <Input
            value={value}
            onChange={({ target }) => setValue(target.value)}
            name="resetToken"
            id={id}
            autoFocus
            required
            placeholder={c('Placeholder').t`Reset code`}
        />
    );
};

export default ResetTokenInput;
