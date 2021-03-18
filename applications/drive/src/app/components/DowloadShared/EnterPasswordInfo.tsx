import React, { useState } from 'react';
import { c } from 'ttag';

import { Button, Label, PasswordInput, useLoading } from 'react-components';

interface Props {
    submitPassword: (password: string) => Promise<void>;
}

const EnterPasswordInfo = ({ submitPassword }: Props) => {
    const [loading, withLoading] = useLoading(false);
    const [password, setPassword] = useState('');

    return (
        <>
            <h3 className="text-bold mt1 mb2">{c('Title').t`Enter file password to download`}</h3>
            <form
                className="w100"
                onSubmit={(e) => {
                    e.preventDefault();
                    withLoading(submitPassword(password)).catch(console.error);
                }}
            >
                <div className="text-left">
                    <Label htmlFor="password">{c('Label').t`Password`}</Label>
                </div>

                <PasswordInput
                    name="password"
                    className="flex"
                    autoComplete="current-password"
                    maxLength={50}
                    id="password"
                    disabled={loading}
                    value={password}
                    onChange={({ target: { value } }) => setPassword(value)}
                />
                <Button
                    size="large"
                    color="norm"
                    className="center mt2 min-w7e"
                    disabled={!password}
                    loading={loading}
                    type="submit"
                >
                    {c('Action').t`Submit`}
                </Button>
            </form>
        </>
    );
};

export default EnterPasswordInfo;
