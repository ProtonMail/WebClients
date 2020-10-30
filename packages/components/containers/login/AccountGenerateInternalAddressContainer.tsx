import React, { useState, useEffect } from 'react';
import { c } from 'ttag';
import { DEFAULT_ENCRYPTION_CONFIG, ENCRYPTION_CONFIGS } from 'proton-shared/lib/constants';
import { queryCheckUsernameAvailability } from 'proton-shared/lib/api/user';
import { getApiErrorMessage } from 'proton-shared/lib/api/helpers/apiErrorHelper';
import { queryAvailableDomains } from 'proton-shared/lib/api/domains';
import { updateUsername } from 'proton-shared/lib/api/settings';
import { generateAddressKey } from 'proton-shared/lib/keys/keys';
import { Api } from 'proton-shared/lib/interfaces';

import { useErrorHandler } from '../../hooks';

import createKeyHelper from '../keys/addKey/createKeyHelper';
import handleSetupAddress from '../signup/helpers/handleSetupAddress';
import AccountGenerateInternalAddressForm from './components/AccountGenerateInternalAddressForm';

interface Props {
    onDone: () => Promise<void>;
    api: Api;
    keyPassword: string;
}
const AccountGenerateInternalAddressContainer = ({ onDone, api, keyPassword }: Props) => {
    const [username, setUsername] = useState('');
    const [usernameError, setUsernameError] = useState('');
    const [availableDomains, setAvailableDomains] = useState([]);
    const errorHandler = useErrorHandler();

    const handleCreateAddressAndKey = async () => {
        if (!keyPassword) {
            throw new Error('Password required to generate keys');
        }

        if (!availableDomains.length) {
            const error = c('Error').t`Domain not available, try again later`;
            throw new Error(error);
        }

        try {
            await api(queryCheckUsernameAvailability(username));
        } catch (e) {
            const errorText = getApiErrorMessage(e) || c('Error').t`Can't check username, try again later`;
            setUsernameError(errorText);
            throw e;
        }
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
            errorHandler(error);
        }
    };

    useEffect(() => {
        const fetchAvailableDomains = async () => {
            const { Domains = [] } = await api(queryAvailableDomains());
            setAvailableDomains(Domains);
        };
        fetchAvailableDomains();
    }, []);

    return (
        <AccountGenerateInternalAddressForm
            username={username}
            usernameError={usernameError}
            setUsername={setUsername}
            setUsernameError={setUsernameError}
            availableDomains={availableDomains}
            onSubmit={handleSubmit}
        />
    );
};

export default AccountGenerateInternalAddressContainer;
