import React from 'react';
import { c } from 'ttag';

import { Input, Label } from '../..';

interface Props {
    totp: string;
    setTotp: (newTotp: string) => void;
}

const TOTPForm = ({ totp, setTotp }: Props) => {
    return (
        <>
            <Label htmlFor="twoFa">{c('Label').t`Two-factor code`}</Label>
            <Input
                type="text"
                name="twoFa"
                autoFocus
                autoCapitalize="off"
                autoCorrect="off"
                id="twoFa"
                required
                value={totp}
                className="w100 mb1"
                placeholder="123456"
                onChange={({ target: { value } }) => setTotp(value)}
                data-cy-login="TOTP"
            />
        </>
    );
};

export default TOTPForm;
