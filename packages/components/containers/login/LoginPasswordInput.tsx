import React from 'react';
import { PasswordInput } from '../../components';

interface Props {
    password: string;
    setPassword: (password: string) => void;
    id: string;
    title?: string;
}
const LoginPasswordInput = ({ password, setPassword, id, title }: Props) => {
    return (
        <PasswordInput
            name="password"
            autoComplete="current-password"
            id={id}
            title={title}
            required
            value={password}
            onChange={({ target: { value } }) => setPassword(value)}
            data-cy-login="password"
        />
    );
};

export default LoginPasswordInput;
