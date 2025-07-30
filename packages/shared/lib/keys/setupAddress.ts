import { c } from 'ttag';

import type { AddressGeneration } from '@proton/components/containers/login/interface';
import { stringToUtf8Array } from '@proton/crypto/lib/utils';
import { queryAvailableDomains } from '@proton/shared/lib/api/domains';
import type { ProductParam } from '@proton/shared/lib/apps/product';
import { getRequiresAddress, getRequiresProtonAddress } from '@proton/shared/lib/authentication/apps';
import { getClientKey } from '@proton/shared/lib/authentication/clientKey';
import { getDecryptedBlob, getEncryptedBlob } from '@proton/shared/lib/authentication/sessionBlobCryptoHelper';
import {
    ADDRESS_TYPE,
    APPS,
    type APP_NAMES,
    KEYGEN_CONFIGS,
    KEYGEN_TYPES,
    PRODUCT_BIT,
} from '@proton/shared/lib/constants';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import { getEmailParts, removePlusAliasLocalPart } from '@proton/shared/lib/helpers/email';
import { isAdmin, isPrivate, isSelf } from '@proton/shared/lib/user/helpers';
import noop from '@proton/utils/noop';

import { getAllAddresses } from '../api/addresses';
import { updateUsername } from '../api/settings';
import { queryCheckUsernameAvailability } from '../api/user';
import type { Address, Api, PreAuthKTVerify, User, User as tsUser } from '../interfaces';
import { UserType } from '../interfaces';
import { createAddressKeyLegacy, createAddressKeyV2 } from './add';
import { getDecryptedUserKeysHelper } from './getDecryptedUserKeys';
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
    // Username is already set (and not a email address), can't be changed.
    if (user.Name) {
        // SSO users get set a user.Name with the SSO address, like `user@sso-domain.org`. This ensures that the
        // username is without a domain.
        const [, domain] = getEmailParts(user.Name);
        if (!domain) {
            return {
                username: user.Name,
                domain,
                type: ClaimableAddressType.Fixed,
            };
        }
    }
    const localEmailPart = getLocalPart(email).trim();
    await api(queryCheckUsernameAvailability(`${localEmailPart}@${domain}`, true));
    return { username: localEmailPart, domain, type: ClaimableAddressType.Any };
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
    addresses,
    user,
}: {
    username: string;
    domain: string;
    api: Api;
    passphrase: string;
    preAuthKTVerify: PreAuthKTVerify;
    user: User;
    addresses: Address[];
}) => {
    if (!passphrase) {
        throw new Error('Password required to generate keys');
    }
    const [address] = await handleSetupUsernameAndAddress({ api, username, user, domain });
    const userKeys = await getDecryptedUserKeysHelper(user, passphrase);
    const hasV6UserKeys = userKeys.some((key) => key.privateKey.isPrivateKeyV6());
    const keyTransparencyVerify = preAuthKTVerify(userKeys);
    if (getHasMigratedAddressKeys(addresses)) {
        const [, updatedActiveKeys] = await createAddressKeyV2({
            api,
            userKeys,
            address,
            activeKeys: { v4: [], v6: [] },
            keyTransparencyVerify,
        });

        if (hasV6UserKeys) {
            // also generate a v6 address key
            await createAddressKeyV2({
                api,
                userKeys,
                address,
                activeKeys: updatedActiveKeys,
                keyTransparencyVerify,
                keyGenConfig: KEYGEN_CONFIGS[KEYGEN_TYPES.PQC],
            });
        }
    } else {
        await createAddressKeyLegacy({
            api,
            passphrase: passphrase,
            address,
            activeKeys: { v4: [], v6: [] },
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
    productParam,
    user,
    addresses,
}: {
    username: string;
    domain: string;
    api: Api;
    password: string;
    preAuthKTVerify: PreAuthKTVerify;
    productParam: ProductParam;
    user: User;
    addresses: Address[];
}) => {
    if (!password) {
        throw new Error('Password required to setup keys');
    }
    const createdAddresses = await handleSetupUsernameAndAddress({ api, username, user, domain });
    const addressesToSetup = [...addresses, ...createdAddresses];
    return handleSetupKeys({
        api,
        addresses: addressesToSetup,
        password,
        preAuthKTVerify,
        product: productParam,
    });
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
        (user.Services === 0 || hasBit(user.Services, PRODUCT_BIT.MAIL))
    );
};

export const getIsSSOAccount = (user: tsUser | undefined): user is tsUser => {
    return Boolean(user && user.Flags.sso);
};

export const getIsSSOVPNOnlyAccount = (user: tsUser | undefined) => {
    return getIsSSOAccount(user) && !user.Keys.length;
};

export const getIsGlobalSSOAccount = (user: tsUser | undefined) => {
    return getIsSSOAccount(user) && user.Keys.length > 0;
};

export const getIsVPNOnlyAccount = (user: tsUser | undefined) => {
    if (!user) {
        return false;
    }
    // The vpn service product bit is used as a heuristic to determine if it's an account without addresses
    // NOTE: For vpn and pass bundle, Services gets incorrectly set to 12 = 4 + Pass
    return (
        user.Type === UserType.PROTON &&
        !user.Keys.length &&
        hasBit(user.Services, PRODUCT_BIT.VPN) &&
        !hasBit(user.Services, PRODUCT_BIT.MAIL)
    );
};

export const getIsExternalAccount = (user: tsUser) => {
    if (!user) {
        return false;
    }
    return user.Type === UserType.EXTERNAL || user.Flags['no-proton-address'];
};

export const getCanSetupProtonAddress = (user: tsUser | undefined): boolean => {
    return Boolean(
        user &&
            // Is currently external
            getIsExternalAccount(user) &&
            // Managed users cannot create a Proton address.
            // The API checks for $user->isSubUser() -> `Proton Mail domain address creation is not allowed for this user`
            user.Type !== UserType.MANAGED &&
            // Impersonation not allowed
            isSelf(user) &&
            // This is a key setup check. Admins can create keys for non-private and private users. If not admin, it needs to be a private user to setup keys.
            (isAdmin(user) || isPrivate(user))
    );
};

export const getIsExternalUserWithoutProtonAddressCreation = (user: tsUser | undefined) => {
    return Boolean(user && getIsExternalAccount(user) && !getCanSetupProtonAddress(user));
};

export const getIsBYOEAccount = (user: tsUser) => {
    if (!user) {
        return false;
    }
    return user.Flags['has-a-byoe-address'];
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

    // BYOE users should be able to open Mail without facing the "claim Proton address" step
    if (toApp === APPS.PROTONMAIL && getIsBYOEAccount(user)) {
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

export const getEncryptedSetupBlob = async (clientKey: string, loginPassword: string) => {
    const key = await getClientKey(clientKey);
    const setupBlob: SetupBlob = {
        loginPassword,
    };
    return getEncryptedBlob(key, JSON.stringify(setupBlob), stringToUtf8Array('setup'));
};

export const getDecryptedSetupBlob = async (clientKey: string, blob: string): Promise<SetupBlob | undefined> => {
    try {
        const key = await getClientKey(clientKey);
        const result = await getDecryptedBlob(key, blob, stringToUtf8Array('setup'));
        const json = JSON.parse(result);
        if (!json?.loginPassword) {
            return undefined;
        }
        return json;
    } catch (e) {
        return;
    }
};
