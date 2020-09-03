import React, { ChangeEvent, FunctionComponent, useState, useEffect } from 'react';
import { c } from 'ttag';
import {
    APP_NAMES,
    DEFAULT_ENCRYPTION_CONFIG,
    ENCRYPTION_CONFIGS,
    USERNAME_PLACEHOLDER,
} from 'proton-shared/lib/constants';
import { queryCheckUsernameAvailability } from 'proton-shared/lib/api/user';
import { getApiErrorMessage } from 'proton-shared/lib/api/helpers/apiErrorHelper';
import { queryAvailableDomains } from 'proton-shared/lib/api/domains';
import { updateUsername } from 'proton-shared/lib/api/settings';
import { generateAddressKey } from 'proton-shared/lib/keys/keys';
import { Api } from 'proton-shared/lib/interfaces';

import { Input, Label, PrimaryButton } from '../../components';
import { useLoading, useNotifications } from '../../hooks';

import BackButton from '../signup/BackButton';
import { Props as AccountPublicLayoutProps } from '../signup/AccountPublicLayout';
import { getToAppName } from '../signup/helpers/helper';
import createKeyHelper from '../keys/addKey/createKeyHelper';
import SignupLabelInputRow from '../signup/SignupLabelInputRow';
import SignupSubmitRow from '../signup/SignupSubmitRow';
import handleSetupAddress from '../signup/helpers/handleSetupAddress';

interface Props {
    Layout: FunctionComponent<AccountPublicLayoutProps>;
    externalEmailAddress: string;
    toApp?: APP_NAMES;
    onDone: () => Promise<void>;
    onBack: () => void;
    api: Api;
    keyPassword: string;
}
const AccountGenerateInternalAddressContainer = ({
    Layout,
    externalEmailAddress,
    toApp,
    onBack,
    onDone,
    api,
    keyPassword,
}: Props) => {
    const appName = getToAppName(toApp);

    const [username, setUsername] = useState('');
    const [usernameError, setUsernameError] = useState('');
    const [loading, withLoading] = useLoading();
    const [loadingAvailableDomains, withLoadingAvailableDomains] = useLoading();
    const { createNotification } = useNotifications();
    const [availableDomains, setAvailableDomains] = useState([]);

    const handleCreateAddressAndKey = async () => {
        if (!keyPassword) {
            throw new Error('Password required to generate keys');
        }

        if (!availableDomains.length) {
            const error = c('Error').t`Domain not available, try again later`;
            throw new Error(error);
        }

        await api(queryCheckUsernameAvailability(username));
        await api(updateUsername({ Username: username }));

        const [Address] = await handleSetupAddress({ api, domains: availableDomains, username });

        const { privateKey, privateKeyArmored } = await generateAddressKey({
            email: Address.Email,
            passphrase: keyPassword,
            encryptionConfig: ENCRYPTION_CONFIGS[DEFAULT_ENCRYPTION_CONFIG],
        });

        await createKeyHelper({
            api,
            privateKeyArmored,
            privateKey,
            Address,
            parsedKeys: [],
            actionableKeys: [],
            signingKey: privateKey,
        });
    };

    const handleSubmit = async () => {
        try {
            await handleCreateAddressAndKey();
            await onDone();
        } catch (error) {
            const errorText = getApiErrorMessage(error) || c('Error').t`Can't check username, try again later`;
            setUsernameError(errorText);
            createNotification({ type: 'error', text: errorText });
        }
    };

    const fetchAvailableDomains = async () => {
        const { Domains = [] } = await api(queryAvailableDomains());
        setAvailableDomains(Domains);
    };

    useEffect(() => {
        withLoadingAvailableDomains(fetchAvailableDomains());
    }, []);

    return (
        <Layout
            title={c('Title').t`Create a ProtonMail address`}
            subtitle={c('Info')
                .t`Your Proton Account is associated with ${externalEmailAddress}. To use ${appName}, please create an address.`}
            left={<BackButton onClick={onBack} />}
        >
            <form
                name="addressForm"
                className="signup-form"
                onSubmit={(e) => {
                    e.preventDefault();
                    withLoading(handleSubmit());
                }}
            >
                <SignupLabelInputRow
                    label={<Label htmlFor="login">{c('Label').t`Username`}</Label>}
                    input={
                        <div className="flex flex-nowrap flex-items-center flex-item-fluid relative mb0-5">
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
                                    className="pm-field--username"
                                    required
                                />
                            </div>
                            {availableDomains.length ? (
                                <span className="pt0-75 right-icon absolute">@{availableDomains[0]}</span>
                            ) : null}
                        </div>
                    }
                />
                <SignupSubmitRow>
                    <PrimaryButton
                        type="submit"
                        className="pm-button--large"
                        disabled={loadingAvailableDomains}
                        loading={loading}
                        data-cy-login="submit"
                    >
                        {c('Action').t`Next`}
                    </PrimaryButton>
                </SignupSubmitRow>
            </form>
        </Layout>
    );
};

export default AccountGenerateInternalAddressContainer;
