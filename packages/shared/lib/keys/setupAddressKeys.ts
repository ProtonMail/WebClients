import { getAllAddresses, setupAddress as setupAddressRoute } from '../api/addresses';
import { queryAvailableDomains } from '../api/domains';
import { Api, Address as tsAddress } from '../interfaces';
import { handleSetupKeys } from './setupKeys';

interface SetupAddressArgs {
    api: Api;
    username: string;
    domain: string;
}

export const handleSetupAddress = async ({ api, username, domain }: SetupAddressArgs) => {
    if (!domain) {
        throw new Error('Missing domain');
    }
    const { Address } = await api<{ Address: tsAddress }>(
        setupAddressRoute({
            Domain: domain,
            DisplayName: username,
            Signature: '',
        })
    );
    return [Address];
};

interface SetupAddressKeysArgs {
    password: string;
    api: Api;
    username: string;
    hasAddressKeyMigrationGeneration: boolean;
}

export const handleSetupAddressKeys = async ({
    username,
    password,
    api,
    hasAddressKeyMigrationGeneration,
}: SetupAddressKeysArgs) => {
    const [availableAddresses, availableDomains] = await Promise.all([
        getAllAddresses(api),
        api<{ Domains: string[] }>(queryAvailableDomains('signup')).then(({ Domains }) => Domains),
    ]);

    const addressesToUse =
        availableAddresses?.length > 0
            ? availableAddresses
            : await handleSetupAddress({ api, domain: availableDomains[0], username });

    return handleSetupKeys({ api, addresses: addressesToUse, password, hasAddressKeyMigrationGeneration });
};
