import { utf8StringToUint8Array } from '@protontech/crypto/utils';
import { c } from 'ttag';

import type { AddressGeneration } from '@proton/components/containers/login/interface';
import { queryAvailableDomains } from '@proton/shared/lib/api/domains';
import type { ProductParam } from '@proton/shared/lib/apps/product';
import { getRequiresAddress, getRequiresProtonAddress } from '@proton/shared/lib/authentication/apps';
import { getClientKey } from '@proton/shared/lib/authentication/clientKey';
import { getDecryptedBlob, getEncryptedBlob } from '@proton/shared/lib/authentication/sessionBlobCryptoHelper';
import { ADDRESS_TYPE, APPS, type APP_NAMES, KEYGEN_CONFIGS, KEYGEN_TYPES } from '@proton/shared/lib/constants';
import { getEmailParts, removePlusAliasLocalPart } from '@proton/shared/lib/helpers/email';
import { isPrivate } from '@proton/shared/lib/user/helpers';
import noop from '@proton/utils/noop';

import { getAllAddresses } from '../api/addresses';
import { updateUsername } from '../api/settings';
import { queryCheckUsernameAvailability } from '../api/user';
import type { Address, Api, PreAuthKTVerify, User, User as tsUser } from '../interfaces';
import { getIsBYOEAccount, getIsExternalAccount, getIsVPNOnlyAccount, getRequiresMailKeySetup } from './accountType';
import { createAddressKeyLegacy, createAddressKeyV2 } from './add';
import { getDecryptedUserKeysHelper } from './getDecryptedUserKeys';
import { getHasMigratedAddressKeys } from './keyMigration';
import { handleSetupAddress } from './setupAddressKeys';
import { handleSetupKeys } from './setupKeys';

export {
    getCanSetupProtonAddress,
    getIsBYOEAccount,
    getIsExternalAccount,
    getIsExternalUserWithoutProtonAddressCreation,
    getIsGlobalSSOAccount,
    getIsSSOAccount,
    getIsSSOVPNOnlyAccount,
    getIsVPNOnlyAccount,
    getRequiresMailKeySetup,
    getRequiresPasswordSetup,
} from './accountType';

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
        const [, emailDomain] = getEmailParts(user.Name);
        if (!emailDomain) {
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
    return getEncryptedBlob(key, JSON.stringify(setupBlob), utf8StringToUint8Array('setup'));
};

export const getDecryptedSetupBlob = async (clientKey: string, blob: string): Promise<SetupBlob | undefined> => {
    try {
        const key = await getClientKey(clientKey);
        const result = await getDecryptedBlob(key, blob, utf8StringToUint8Array('setup'));
        const json = JSON.parse(result);
        if (!json?.loginPassword) {
            return undefined;
        }
        return json;
    } catch (e) {
        return;
    }
};
