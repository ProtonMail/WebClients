import React, { useState, useEffect } from 'react';
import { c } from 'ttag';
import { getUser, queryCheckUsernameAvailability } from 'proton-shared/lib/api/user';
import { queryAddresses } from 'proton-shared/lib/api/addresses';
import { getApiErrorMessage } from 'proton-shared/lib/api/helpers/apiErrorHelper';
import { queryAvailableDomains } from 'proton-shared/lib/api/domains';
import { updateUsername } from 'proton-shared/lib/api/settings';
import { Api, Address as tsAddress, User as tsUser } from 'proton-shared/lib/interfaces';
import {
    createAddressKeyLegacy,
    createAddressKeyV2,
    getDecryptedUserKeys,
    getHasMigratedAddressKeys,
    getPrimaryKey,
} from 'proton-shared/lib/keys';

import { useErrorHandler } from '../../hooks';

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

        const [user, addresses] = await Promise.all([
            api<{ User: tsUser }>(getUser()).then(({ User }) => User),
            api<{ Addresses: tsAddress[] }>(queryAddresses()).then(({ Addresses }) => Addresses),
        ]);

        try {
            await api(queryCheckUsernameAvailability(username));
        } catch (e) {
            const errorText = getApiErrorMessage(e) || c('Error').t`Can't check username, try again later`;
            setUsernameError(errorText);
            throw e;
        }
        await api(updateUsername({ Username: username }));

        const [Address] = await handleSetupAddress({ api, domains: availableDomains, username });

        if (getHasMigratedAddressKeys(addresses)) {
            const userKeys = await getDecryptedUserKeys({
                user,
                userKeys: user.Keys,
                keyPassword,
            });
            const primaryUserKey = getPrimaryKey(userKeys)?.privateKey;
            if (!primaryUserKey) {
                throw new Error('Missing primary user key');
            }
            await createAddressKeyV2({
                api,
                userKey: primaryUserKey,
                address: Address,
                activeKeys: [],
            });
        } else {
            await createAddressKeyLegacy({
                api,
                passphrase: keyPassword,
                address: Address,
                activeKeys: [],
            });
        }
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
