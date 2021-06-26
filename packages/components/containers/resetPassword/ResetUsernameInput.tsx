import React from 'react';
import { c } from 'ttag';

import { Input } from '../../components';

interface Props {
    value: string;
    setValue: (username: string) => void;
    id: string;
    placeholder?: string;
}

const ResetUsernameInput = ({ id, value, setValue, placeholder = c('Placeholder').t`Username` }: Props) => {
    return (
        <Input
            name="username"
            autoFocus
            autoCapitalize="off"
            autoCorrect="off"
            id={id}
            placeholder={placeholder}
            value={value}
            onChange={({ target: { value } }) => setValue(value)}
            required
        />
    );
};

export default ResetUsernameInput;
