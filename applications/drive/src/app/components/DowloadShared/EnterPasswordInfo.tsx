import React, { useState } from 'react';
import { c } from 'ttag';

import { Label, PasswordInput, PrimaryButton, useLoading } from 'react-components';

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
                <PrimaryButton
                    className="button--large center mt2 w150p"
                    disabled={!password}
                    loading={loading}
                    type="submit"
                >
                    {c('Action').t`Submit`}
                </PrimaryButton>
            </form>
        </>
    );
};

export default EnterPasswordInfo;
