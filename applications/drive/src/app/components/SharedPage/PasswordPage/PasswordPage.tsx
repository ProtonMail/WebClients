import { FormEvent, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon, InputFieldTwo, PasswordInputTwo } from '@proton/components';
import { useLoading } from '@proton/hooks';

import SharedPageLayout from '../Layout/SharedPageLayout';

import './PasswordPage.scss';

interface Props {
    submitPassword: (password: string) => Promise<void>;
}

export default function PasswordPage({ submitPassword }: Props) {
    const [loading, withLoading] = useLoading(false);
    const [password, setPassword] = useState('');

    const handlePasswordSubmit = (e: FormEvent) => {
        e.preventDefault();
        void withLoading(submitPassword(password));
    };

    return (
        <SharedPageLayout>
            <div className="flex flex-item-fluid flex-align-items-center py-7 mb-14">
                <div className="password-page--form-container ui-standard w100 relative shadow-lifted mw30r max-w100 mx-auto px-8 py-11 rounded">
                    <div className="flex flex-justify-center pb-7">
                        <span className="password-page--icon-container rounded p-4">
                            <Icon name="key-skeleton" className="color-primary" size={28} />
                        </span>
                    </div>
                    <h3 className="text-center text-bold mb-2">{c('Title').t`This link is password protected`}</h3>
                    <p className="text-center mt-0">{c('Info')
                        .t`Please enter the password to decrypt and view content.`}</p>
                    <form className="w100 mt-8" autoComplete="off" onSubmit={handlePasswordSubmit}>
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
                        <Button
                            size="large"
                            fullWidth
                            color="norm"
                            disabled={!password}
                            loading={loading}
                            type="submit"
                        >
                            {c('Action').t`Continue`}
                        </Button>
                    </form>
                </div>
            </div>
        </SharedPageLayout>
    );
}
