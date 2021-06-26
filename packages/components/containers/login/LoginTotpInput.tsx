import React from 'react';
import { Input } from '../../components';

interface Props {
    totp: string;
    setTotp: (totp: string) => void;
    id: string;
}
const LoginTotpInput = ({ totp, setTotp, id }: Props) => {
    return (
        <Input
            type="text"
            name="twoFa"
            autoFocus
            autoCapitalize="off"
            autoCorrect="off"
            id={id}
            required
            value={totp}
            className="w100"
            placeholder="123456"
            onChange={({ target: { value } }) => setTotp(value)}
            data-cy-login="TOTP"
        />
    );
};

export default LoginTotpInput;
