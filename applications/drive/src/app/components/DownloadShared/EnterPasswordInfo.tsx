import { useState } from 'react';
import { c } from 'ttag';

import { Button, PasswordInputTwo, InputFieldTwo, useLoading } from '@proton/components';

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
