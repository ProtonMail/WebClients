import React from 'react';
import { EMAIL_PLACEHOLDER } from 'proton-shared/lib/constants';
import { Input } from '../../components';

interface Props {
    username: string;
    setUsername: (username: string) => void;
    id: string;
}
const LoginUsernameInput = ({ username, setUsername, id }: Props) => {
    return (
        <Input
            type="text"
            name="login"
            autoFocus
            autoCapitalize="off"
            autoCorrect="off"
            id={id}
            required
            value={username}
            placeholder={EMAIL_PLACEHOLDER}
            onChange={({ target: { value } }) => setUsername(value)}
            data-cy-login="username"
        />
    );
};

export default LoginUsernameInput;
