import { useState } from 'react';
import { c } from 'ttag';

import { Button, PasswordInputTwo, InputFieldTwo, useLoading } from '@proton/components';

import SharedPageLayout from './SharedPageLayout';

interface Props {
    submitPassword: (password: string) => Promise<void>;
}

export default function PasswordPage({ submitPassword }: Props) {
    const [loading, withLoading] = useLoading(false);
    const [password, setPassword] = useState('');

    return (
        <SharedPageLayout>
            <h3 className="text-center text-bold">{c('Title').t`This link is password protected`}</h3>
            <p className="text-center mt0">{c('Info').t`Please enter the password to decrypt and view content.`}</p>
            <form
                className="w100 mt2"
                onSubmit={(e) => {
                    e.preventDefault();
                    withLoading(submitPassword(password)).catch(console.error);
                }}
            >
                <InputFieldTwo
                    bigger
                    as={PasswordInputTwo}
                    label={c('Label').t`Password`}
                    autoComplete="current-password"
                    id="password"
                    disabled={loading}
                    value={password}
                    onValue={setPassword}
                />
                <Button size="large" fullWidth color="norm" disabled={!password} loading={loading} type="submit">
                    {c('Action').t`Submit`}
                </Button>
            </form>
        </SharedPageLayout>
    );
}
