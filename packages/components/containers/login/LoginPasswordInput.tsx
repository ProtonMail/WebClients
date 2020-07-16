import React from 'react';
import { PASSWORD_PLACEHOLDER } from 'proton-shared/lib/constants';
import { PasswordInput } from '../../index';

interface Props {
    password: string;
    setPassword: (password: string) => void;
    id: string;
}
const LoginPasswordInput = ({ password, setPassword, id }: Props) => {
    return (
        <PasswordInput
            name="password"
            autoComplete="current-password"
            id={id}
            required
            value={password}
            placeholder={PASSWORD_PLACEHOLDER}
            onChange={({ target: { value } }) => setPassword(value)}
            data-cy-login="password"
        />
    );
};

export default LoginPasswordInput;
