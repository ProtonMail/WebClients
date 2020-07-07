import React from 'react';
import { c } from 'ttag';
import { Input, Label } from '../..';

interface Props {
    password: string;
    setPassword: (newPassword: string) => void;
}

const UnlockForm = ({ password, setPassword }: Props) => {
    return (
        <>
            <Label htmlFor="password">{c('Label').t`Mailbox password`}</Label>
            <Input
                type="password"
                name="password"
                autoFocus
                autoCapitalize="off"
                autoCorrect="off"
                id="password"
                required
                className="w100 mb1"
                value={password}
                placeholder={c('Placeholder').t`Mailbox password`}
                onChange={({ target: { value } }) => setPassword(value)}
                data-cy-login="mailbox password"
            />
        </>
    );
};

export default UnlockForm;
