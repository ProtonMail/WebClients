import { c } from 'ttag';
import React from 'react';
import { Input } from '../../components';

interface Props {
    password: string;
    setPassword: (password: string) => void;
    id: string;
}

const LoginUnlockInput = ({ password, setPassword, id }: Props) => {
    return (
        <Input
            type="password"
            name="password"
            autoFocus
            autoCapitalize="off"
            autoCorrect="off"
            id={id}
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
