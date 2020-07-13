import React from 'react';
import { c } from 'ttag';
import { Input } from '../../index';

interface Props {
    value: string;
    setValue: (username: string) => void;
    id: string;
}

const ResetUsernameInput = ({ id, value, setValue }: Props) => {
    return (
        <Input
            name="username"
            autoFocus
            autoCapitalize="off"
            autoCorrect="off"
            id={id}
            placeholder={c('Placeholder').t`Username`}
            value={value}
            onChange={({ target: { value } }) => setValue(value)}
            required
        />
    );
};

export default ResetUsernameInput;
