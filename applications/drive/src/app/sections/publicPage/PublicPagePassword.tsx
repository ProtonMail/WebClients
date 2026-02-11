import type { FormEvent } from 'react';
import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Icon, InputFieldTwo, PasswordInputTwo } from '@proton/components';
import { useLoading } from '@proton/hooks';

interface PublicPagePasswordProps {
    submitPassword: (password: string) => Promise<void>;
}

export const PublicPagePassword = ({ submitPassword }: PublicPagePasswordProps) => {
    const [loading, withLoading] = useLoading(false);
    const [password, setPassword] = useState('');

    const handlePasswordSubmit = (e: FormEvent) => {
        e.preventDefault();
        void withLoading(submitPassword(password));
    };

    return (
        <div className="flex flex-1 items-center py-7 mb-14 h-full">
            <div
                className="ui-standard w-full relative shadow-lifted max-w-custom mx-auto px-8 py-11 rounded"
                style={{ '--max-w-custom': '30rem' }}
            >
                <div className="flex justify-center pb-7">
                    <span className="password-page--icon-container rounded p-4">
                        <Icon name="key-skeleton" className="color-primary" size={7} />
                    </span>
                </div>
                <h3 className="text-center text-bold mb-2">{c('Title').t`This link is password protected`}</h3>
                <p className="text-center mt-0">{c('Info')
                    .t`Please enter the password to decrypt and view content.`}</p>
                <form className="w-full mt-8" autoComplete="off" onSubmit={handlePasswordSubmit}>
                    <div className="mt-4 mb-8">
                        <InputFieldTwo
                            bigger
                            as={PasswordInputTwo}
                            label={c('Label').t`Password`}
                            autoComplete="off"
                            id="password"
                            disabled={loading}
                            value={password}
                            onValue={setPassword}
                            placeholder={c('Info').t`Enter password`}
                            assistiveText={c('Info').t`Link owner has the password`}
                        />
                    </div>
                    <Button size="large" fullWidth color="norm" disabled={!password} loading={loading} type="submit">
                        {c('Action').t`Continue`}
                    </Button>
                </form>
            </div>
        </div>
    );
};
