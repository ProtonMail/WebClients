import { c } from 'ttag';
import React from 'react';
import { PasswordInput } from '../../components';

interface Props {
    password: string;
    setPassword: (password: string) => void;
    id: string;
    error?: string;
}

const LoginUnlockInput = ({ password, setPassword, id, error }: Props) => {
    return (
        <PasswordInput
            name="password"
            autoFocus
            autoCapitalize="off"
            autoCorrect="off"
            id={id}
            error={error}
            required
            className="w100"
            value={password}
            placeholder={c('Placeholder').t`Mailbox password`}
            onChange={({ target: { value } }) => setPassword(value)}
            data-cy-login="mailbox password"
        />
    );
};

export default LoginUnlockInput;
