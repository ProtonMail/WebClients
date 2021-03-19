import React, { ChangeEvent } from 'react';
import { c } from 'ttag';
import { USERNAME_PLACEHOLDER } from 'proton-shared/lib/constants';

import SignupLabelInputRow from '../../signup/SignupLabelInputRow';
import { Label } from '../../../components/label';
import { Input } from '../../../components/input';
import SignupSubmitRow from '../../signup/SignupSubmitRow';
import { PrimaryButton } from '../../../components/button';
import { useLoading } from '../../../hooks';

interface Props {
    onSubmit: () => Promise<void>;
    username: string;
    setUsername: (username: string) => void;
    usernameError: string;
    setUsernameError: (username: string) => void;
    availableDomains?: string[];
}
const AccountGenerateInternalAddressForm = ({
    onSubmit,
    username,
    setUsername,
    usernameError,
    setUsernameError,
    availableDomains,
}: Props) => {
    const [loading, withLoading] = useLoading();

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        withLoading(onSubmit());
    };

    return (
        <form name="addressForm" className="signup-form" onSubmit={handleSubmit} method="post">
            <SignupLabelInputRow
                label={<Label htmlFor="login">{c('Label').t`Username`}</Label>}
                input={
                    <div className="flex flex-nowrap flex-align-items-center flex-item-fluid relative mb0-5">
                        <div className="flex-item-fluid">
                            <Input
                                id="username"
                                name="username"
                                autoFocus
                                autoComplete="off"
                                autoCapitalize="off"
                                autoCorrect="off"
                                value={username}
                                onChange={({ target }: ChangeEvent<HTMLInputElement>) => {
                                    setUsername(target.value);
                                    setUsernameError('');
                                }}
                                error={usernameError}
                                placeholder={USERNAME_PLACEHOLDER}
                                className="field--username"
                                required
                            />
                        </div>
                        {availableDomains?.length ? (
                            <span className="flex right-text absolute">
                                <span className="right-text-inner mauto">@{availableDomains[0]}</span>
                            </span>
                        ) : null}
                    </div>
                }
            />
            <SignupSubmitRow>
                <PrimaryButton
                    type="submit"
                    size="large"
                    disabled={!availableDomains}
                    loading={loading}
                    data-cy-login="submit"
                >
                    {c('Action').t`Next`}
                </PrimaryButton>
            </SignupSubmitRow>
        </form>
    );
};

export default AccountGenerateInternalAddressForm;
