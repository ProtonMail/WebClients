import type { ProductParam } from '@proton/shared/lib/apps/product';

import { setupAddress as setupAddressRoute } from '../api/addresses';
import type { Api, PreAuthKTVerify, Address as tsAddress } from '../interfaces';
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
    productParam: ProductParam;
}

export const handleSetupAddressKeys = async ({
    username,
    password,
    api,
    addresses,
    domains,
    preAuthKTVerify,
    productParam,
}: SetupAddressKeysArgs) => {
    const addressesToUse =
        addresses?.length > 0 ? addresses : await handleSetupAddress({ api, domain: domains[0], username });

    return handleSetupKeys({
        api,
        addresses: addressesToUse,
        password,
        preAuthKTVerify,
        product: productParam,
    });
};
