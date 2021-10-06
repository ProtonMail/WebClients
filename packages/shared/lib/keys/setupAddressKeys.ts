import { getAllAddresses, setupAddress as setupAddressRoute } from '../api/addresses';
import { queryAvailableDomains } from '../api/domains';
import { Address as tsAddress, Api } from '../interfaces';
import { handleSetupKeys } from './setupKeys';

interface SetupAddressArgs {
    api: Api;
    username: string;
    domains: string[];
}

export const handleSetupAddress = async ({ api, username, domains }: SetupAddressArgs) => {
    const [domain = ''] = domains;
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
        api<{ Domains: string[] }>(queryAvailableDomains()).then(({ Domains }) => Domains),
    ]);

    const addressesToUse =
        availableAddresses?.length > 0
            ? availableAddresses
            : await handleSetupAddress({ api, domains: availableDomains, username });

    return handleSetupKeys({ api, addresses: addressesToUse, password, hasAddressKeyMigrationGeneration });
};
