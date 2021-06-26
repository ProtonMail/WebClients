import React from 'react';
import { Input } from '../../components';

interface Props {
    code: string;
    setCode: (code: string) => void;
    id: string;
}
const LoginRecoveryCodeInput = ({ code, setCode, id }: Props) => {
    return (
        <Input
            type="text"
            name="recoveryCode"
            autoFocus
            autoCapitalize="off"
            autoCorrect="off"
            id={id}
            required
            value={code}
            className="w100"
            placeholder="123456"
            onChange={({ target: { value } }: React.ChangeEvent<HTMLInputElement>) => setCode(value)}
            data-cy-login="recoveryCode"
        />
    );
};

export default LoginRecoveryCodeInput;
