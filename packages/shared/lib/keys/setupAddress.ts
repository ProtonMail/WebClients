import { c } from 'ttag';

import { AddressGeneration } from '@proton/components/containers/login/interface';
import { getLocalKey } from '@proton/shared/lib/api/auth';
import { queryAvailableDomains } from '@proton/shared/lib/api/domains';
import { getRequiresAddress, getRequiresProtonAddress } from '@proton/shared/lib/authentication/apps';
import { getKey } from '@proton/shared/lib/authentication/cryptoHelper';
import { LocalKeyResponse } from '@proton/shared/lib/authentication/interface';
import { getDecryptedBlob, getEncryptedBlob } from '@proton/shared/lib/authentication/sessionBlobCryptoHelper';
import { ADDRESS_TYPE, APP_NAMES, PRODUCT_BIT } from '@proton/shared/lib/constants';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import { getEmailParts, removePlusAliasLocalPart } from '@proton/shared/lib/helpers/email';
import { base64StringToUint8Array } from '@proton/shared/lib/helpers/encoding';
import { isPrivate } from '@proton/shared/lib/user/helpers';
import noop from '@proton/utils/noop';

import { getAllAddresses } from '../api/addresses';
import { updateUsername } from '../api/settings';
import { getUser, queryCheckUsernameAvailability } from '../api/user';
import { Address, Api, PreAuthKTVerify, UserType, User as tsUser } from '../interfaces';
import { createAddressKeyLegacy, createAddressKeyV2 } from './add';
import { getDecryptedUserKeysHelper } from './getDecryptedUserKeys';
import { getPrimaryKey } from './getPrimaryKey';
import { getHasMigratedAddressKeys } from './keyMigration';
import { handleSetupAddress } from './setupAddressKeys';
import { handleSetupKeys } from './setupKeys';

export const getLocalPart = (email: string) => {
    const [localPart] = getEmailParts(email);
    return removePlusAliasLocalPart(localPart);
};

export enum ClaimableAddressType {
    Fixed,
    Any,
}

export interface ClaimableAddress {
    username: string;
    domain: string;
    type: ClaimableAddressType;
}

export const getClaimableAddress = async ({
    user,
    api,
    email = '',
    domains,
}: {
    user: tsUser;
    api: Api;
    email: string | undefined;
    domains: string[];
}): Promise<ClaimableAddress> => {
    const domain = domains[0];
    // Username is already set, can't be changed.
    if (user.Name) {
        return {
            username: user.Name,
            domain,
            type: ClaimableAddressType.Fixed,
        };
    }
    const username = getLocalPart(email).trim();
    await api(queryCheckUsernameAvailability(`${username}@${domain}`, true));
    return { username, domain, type: ClaimableAddressType.Any };
};

export type AddressGenerationSetup =
    | {
          mode: 'ask';
      }
    | {
          mode: 'setup';
          loginPassword: string;
      }
    | {
          mode: 'create';
          keyPassword: string;
      };

export interface AddressGenerationPayload {
    username: string;
    domain: string;
    setup: AddressGenerationSetup;
    preAuthKTVerify: PreAuthKTVerify;
}

export const getAddressSetupMode = ({
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

const handleSetupUsernameAndAddress = async ({
    api,
    username,
    user,
    domain,
}: {
    api: Api;
    username: string;
    user: tsUser;
    domain: string;
}) => {
    if (!domain) {
        throw new Error(c('Error').t`Domain not available, try again later`);
    }

    const hasSetUsername = !!user.Name;

    // If the name is already set, fallback to what exists.
    const actualUsername = hasSetUsername ? user.Name : username;

    if (!hasSetUsername) {
        await api(queryCheckUsernameAvailability(actualUsername));
        await api(updateUsername({ Username: actualUsername }));
    }

    return handleSetupAddress({ api, domain, username: actualUsername });
};

export const handleCreateAddressAndKey = async ({
    username,
    domain,
    api,
    passphrase,
    preAuthKTVerify,
}: {
    username: string;
    domain: string;
    api: Api;
    passphrase: string;
    preAuthKTVerify: PreAuthKTVerify;
}) => {
    if (!passphrase) {
        throw new Error('Password required to generate keys');
    }
    const [user, addresses] = await Promise.all([
        api<{ User: tsUser }>(getUser()).then(({ User }) => User),
        getAllAddresses(api),
    ]);
    const [address] = await handleSetupUsernameAndAddress({ api, username, user, domain });
    const userKeys = await getDecryptedUserKeysHelper(user, passphrase);
    const keyTransparencyVerify = preAuthKTVerify(userKeys);
    if (getHasMigratedAddressKeys(addresses)) {
        const primaryUserKey = getPrimaryKey(userKeys)?.privateKey;
        if (!primaryUserKey) {
            throw new Error('Missing primary user key');
        }
        await createAddressKeyV2({
            api,
            userKey: primaryUserKey,
            address,
            activeKeys: [],
            keyTransparencyVerify,
        });
    } else {
        await createAddressKeyLegacy({
            api,
            passphrase: passphrase,
            address,
            activeKeys: [],
            keyTransparencyVerify,
        });
    }

    return passphrase;
};

export const handleSetupAddressAndKey = async ({
    username,
    domain,
    api,
    password,
    preAuthKTVerify,
}: {
    username: string;
    domain: string;
    api: Api;
    password: string;
    preAuthKTVerify: PreAuthKTVerify;
}) => {
    if (!password) {
        throw new Error('Password required to setup keys');
    }
    const [user, addresses] = await Promise.all([
        api<{ User: tsUser }>(getUser()).then(({ User }) => User),
        getAllAddresses(api),
    ]);
    const createdAddresses = await handleSetupUsernameAndAddress({ api, username, user, domain });
    const addressesToSetup = [...addresses, ...createdAddresses];
    return handleSetupKeys({
        api,
        addresses: addressesToSetup,
        password,
        preAuthKTVerify,
    });
};

export const handleAddressGeneration = async ({
    username,
    domain,
    setup,
    api,
    preAuthKTVerify,
}: AddressGenerationPayload & { api: Api }) => {
    if (setup.mode === 'create') {
        return handleCreateAddressAndKey({ username, domain, api, passphrase: setup.keyPassword, preAuthKTVerify });
    }
    if (setup.mode === 'setup') {
        return handleSetupAddressAndKey({
            username,
            domain,
            api,
            password: setup.loginPassword,
            preAuthKTVerify,
        });
    }
    throw new Error('Unknown internal address setup mode');
};

export const getRequiresMailKeySetup = (user: tsUser | undefined) => {
    if (!user) {
        return false;
    }
    // The mail service product bit is used as a heuristic to determine if it's an account with addresses.
    // If it was a VPN account, services would be 4
    return (
        user.Type === UserType.PROTON &&
        !user.Keys.length &&
        (user.Services === 0 || hasBit(user.Services, PRODUCT_BIT.Mail))
    );
};

export const getIsVPNOnlyAccount = (user: tsUser | undefined) => {
    if (!user) {
        return false;
    }
    // The vpn service product bit is used as a heuristic to determine if it's an account without addresses
    return user.Type === UserType.PROTON && !user.Keys.length && user.Services === PRODUCT_BIT.VPN;
};

export const getIsExternalAccount = (user: tsUser) => {
    if (!user) {
        return false;
    }
    return user.Type === UserType.EXTERNAL;
};

export const getRequiresPasswordSetup = (user: tsUser, setupVPN: boolean) => {
    if (!user || user.Keys.length > 0 || !isPrivate(user)) {
        return false;
    }
    return getRequiresMailKeySetup(user) || (getIsVPNOnlyAccount(user) && setupVPN) || getIsExternalAccount(user);
};

export const getRequiresAddressSetup = (toApp: APP_NAMES, user: tsUser) => {
    if (!user || !isPrivate(user)) {
        return false;
    }
    return (
        (getRequiresProtonAddress(toApp) && getIsExternalAccount(user)) ||
        (getRequiresAddress(toApp) && (getIsVPNOnlyAccount(user) || getRequiresMailKeySetup(user)))
    );
};

interface SetupBlob {
    loginPassword: string;
}

export const getEncryptedSetupBlob = async (api: Api, loginPassword: string) => {
    const ClientKey = await api<LocalKeyResponse>(getLocalKey()).then(({ ClientKey }) => ClientKey);
    const rawKey = base64StringToUint8Array(ClientKey);
    const key = await getKey(rawKey);
    const setupBlob: SetupBlob = {
        loginPassword,
    };
    return getEncryptedBlob(key, JSON.stringify(setupBlob));
};

export const getDecryptedSetupBlob = async (api: Api, blob: string): Promise<SetupBlob | undefined> => {
    const ClientKey = await api<LocalKeyResponse>(getLocalKey()).then(({ ClientKey }) => ClientKey);
    const rawKey = base64StringToUint8Array(ClientKey);
    const key = await getKey(rawKey);
    const result = await getDecryptedBlob(key, blob);
    try {
        const json = JSON.parse(result);
        if (!json?.loginPassword) {
            return undefined;
        }
        return json;
    } catch (e) {
        return;
    }
};
