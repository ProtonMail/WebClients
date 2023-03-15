import { setupAddress as setupAddressRoute } from '../api/addresses';
import { Api, PreAuthKTVerify, Address as tsAddress } from '../interfaces';
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
    addresses: tsAddress[];
    domains: string[];
    preAuthKTVerify: PreAuthKTVerify;
}

export const handleSetupAddressKeys = async ({
    username,
    password,
    api,
    addresses,
    domains,
    preAuthKTVerify,
}: SetupAddressKeysArgs) => {
    const addressesToUse =
        addresses?.length > 0 ? addresses : await handleSetupAddress({ api, domain: domains[0], username });

    return handleSetupKeys({ api, addresses: addressesToUse, password, preAuthKTVerify });
};
