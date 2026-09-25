import { getAllAddresses } from '@proton/shared/lib/api/addresses';
import { queryAvailableDomains } from '@proton/shared/lib/api/domains';
import { ADDRESS_TYPE } from '@proton/shared/lib/constants';
import type { Address, Api, User as tsUser } from '@proton/shared/lib/interfaces';
import {
    type AddressGenerationSetup,
    type ClaimableAddress,
    getClaimableAddress,
} from '@proton/shared/lib/keys/setupAddress';
import noop from '@proton/utils/noop';

/** What the address setup step needs: the account's external address, the domains, and how to create keys. */
export interface AddressGeneration {
    externalEmailAddress: Address | undefined;
    availableDomains: string[];
    setup: AddressGenerationSetup;
    claimableAddress: ClaimableAddress | undefined;
}

const getAddressSetupMode = ({
    user,
    keyPassword,
    loginPassword,
}: {
    user: tsUser;
    keyPassword: string | undefined;
    loginPassword: string | undefined;
}): AddressGenerationSetup => {
    if (user.Keys.length > 0) {
        if (!keyPassword) {
            throw new Error('Missing key password, should never happen');
        }
        return {
            mode: 'create',
            keyPassword,
        } as const;
    }
    if (!loginPassword) {
        return {
            mode: 'ask',
        };
    }
    return {
        mode: 'setup',
        loginPassword,
    };
};

export const getAddressGenerationSetup = async ({
    user,
    api,
    addresses: maybeAddresses,
    domains: maybeDomains,
    loginPassword,
    keyPassword,
}: {
    user: tsUser;
    api: Api;
    addresses?: Address[];
    domains?: string[];
    loginPassword: string | undefined;
    keyPassword: string | undefined;
}): Promise<AddressGeneration> => {
    const [addresses, domains] = await Promise.all([
        maybeAddresses || getAllAddresses(api),
        maybeDomains || api<{ Domains: string[] }>(queryAvailableDomains()).then(({ Domains }) => Domains),
    ]);
    const externalEmailAddress = addresses.find((address) => address.Type === ADDRESS_TYPE.TYPE_EXTERNAL);
    const claimableAddress = await getClaimableAddress({
        user,
        api,
        email: externalEmailAddress?.Email,
        domains,
    }).catch(noop);

    return {
        externalEmailAddress,
        availableDomains: domains,
        claimableAddress,
        setup: getAddressSetupMode({
            user,
            loginPassword,
            keyPassword,
        }),
    };
};
