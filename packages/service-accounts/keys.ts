import { CryptoProxy, type PrivateKeyReference } from '@protontech/crypto';
import { c } from 'ttag';

import { generateDelegatedAccessToken, getEncryptedDelegatedAccessToken } from '@proton/account/delegatedAccess/crypto';
import { createKTVerifier } from '@proton/key-transparency/helpers/createKTVerifier';
import { getAndVerifyApiKeys } from '@proton/key-transparency/keys/getAndVerifyApiKeys';
import { getAllMemberAddresses, getMember } from '@proton/shared/lib/api/members';
import { DEFAULT_KEYGEN_TYPE, KEYGEN_CONFIGS } from '@proton/shared/lib/constants';
import type { Api } from '@proton/shared/lib/interfaces/Api';
import type { DecryptedAddressKey, DecryptedKey, KeyPair } from '@proton/shared/lib/interfaces/Key';
import type { KTUserContext } from '@proton/shared/lib/interfaces/KeyTransparency';
import type { Member } from '@proton/shared/lib/interfaces/Member';
import type { CachedOrganizationKey } from '@proton/shared/lib/interfaces/OrganizationKey';
import type { ServiceAccount, ServiceAccountAccessInput } from '@proton/shared/lib/interfaces/ServiceAccount';
import type { ProtonConfig } from '@proton/shared/lib/interfaces/config';
import { getDecryptedAddressKeys } from '@proton/shared/lib/keys/getDecryptedAddressKeys';
import { getDecryptedUserKeys } from '@proton/shared/lib/keys/getDecryptedUserKeys';
import { getPrimaryKey } from '@proton/shared/lib/keys/getPrimaryKey';
import { createMemberAddressKeysV2, setupMemberKeys } from '@proton/shared/lib/keys/memberKeys';
import noop from '@proton/utils/noop';

interface Context {
    api: Api;
    organizationKey: CachedOrganizationKey;
    serviceAccount: ServiceAccount;
    ktUserContext: KTUserContext;
}

/** Remove decrypted keys from the crypto worker once they are no longer needed. */
const clearKeys = (keys: Partial<KeyPair>[]) =>
    Promise.all(
        keys
            .flatMap(({ privateKey, publicKey }) => [privateKey, publicKey])
            .map((key) => (key ? CryptoProxy.clearKey({ key }).catch(noop) : undefined))
    );

const getOrganizationKeyPair = (organizationKey: CachedOrganizationKey, error: string): KeyPair => {
    if (!organizationKey.privateKey || !organizationKey.publicKey) {
        throw new Error(error);
    }
    return { privateKey: organizationKey.privateKey, publicKey: organizationKey.publicKey };
};

const getServiceAccountMember = async (api: Api, serviceAccount: ServiceAccount) => {
    const [{ Member }, memberAddresses] = await Promise.all([
        api<{ Member: Member }>(getMember(serviceAccount.MemberID)),
        getAllMemberAddresses(api, serviceAccount.MemberID),
    ]);
    const address = memberAddresses.find(({ ID }) => ID === serviceAccount.AddressID);
    if (!address) {
        throw new Error(c('Error').t`The service account address is unavailable. Please try again.`);
    }
    return { Member, memberAddresses, address };
};

/** Decrypt the user keys, refusing a partial set so managers never receive incomplete access. */
const getDecryptedServiceAccountUserKeys = async (Member: Member, organizationKey: KeyPair) => {
    const memberUserKeys = await getDecryptedUserKeys(Member.Keys, '', organizationKey);
    const decryptedIDs = new Set(memberUserKeys.map(({ ID }) => ID));
    if (!memberUserKeys.length || Member.Keys.some(({ ID, Active }) => Active && !decryptedIDs.has(ID))) {
        await clearKeys(memberUserKeys);
        throw new Error(c('Error').t`Some service account keys could not be decrypted.`);
    }
    return memberUserKeys;
};

/** Service accounts have no login credentials: generate their keys without SRP authentication. */
export const setupServiceAccountKeys = async ({
    api,
    organizationKey,
    serviceAccount,
    ktUserContext,
    config,
}: Context & { config: ProtonConfig }) => {
    const organizationKeyPair = getOrganizationKeyPair(
        organizationKey,
        c('Error').t`Unlock your organization key to set up this service account.`
    );
    const { Member, memberAddresses, address } = await getServiceAccountMember(api, serviceAccount);
    const hasUserKeys = !!Member.Keys.length;
    const hasAddressKeys = !!address.Keys?.length;
    if (hasUserKeys && hasAddressKeys) {
        return;
    }
    const { keyTransparencyVerify, keyTransparencyCommit } = createKTVerifier({
        api,
        config,
        ktActivation: ktUserContext.ktActivation,
    });
    if (!hasUserKeys) {
        const { userPrivateKey } = await setupMemberKeys({
            api,
            member: Member,
            memberAddresses,
            ownerAddresses: [],
            organizationKey: organizationKeyPair.privateKey,
            password: generateDelegatedAccessToken(),
            keyGenConfig: KEYGEN_CONFIGS[DEFAULT_KEYGEN_TYPE],
            keyTransparencyVerify,
            skipSrp: true,
        });
        await clearKeys([{ privateKey: userPrivateKey }]);
    } else {
        // A previous setup left the user key without an address key: add the missing address key.
        const memberUserKeys = await getDecryptedServiceAccountUserKeys(Member, organizationKeyPair);
        try {
            await createMemberAddressKeysV2({
                api,
                member: Member,
                memberAddress: address,
                memberAddressKeys: [],
                memberUserKey: getPrimaryKey(memberUserKeys)!.privateKey,
                organizationKey: organizationKeyPair.privateKey,
                keyGenConfig: KEYGEN_CONFIGS[DEFAULT_KEYGEN_TYPE],
                keyTransparencyVerify,
            });
        } finally {
            await clearKeys(memberUserKeys);
        }
    }
    const [user, userKeys] = await Promise.all([ktUserContext.getUser(), ktUserContext.getUserKeys()]);
    await keyTransparencyCommit(user, userKeys);
};

export interface ServiceAccountKeys {
    memberUserKeys: DecryptedKey[];
    sourceAddressID: string;
    sourceKey: PrivateKeyReference;
}

/** Decrypt the service account keys once so they can be shared with several managers. */
export const getServiceAccountKeys = async ({
    api,
    organizationKey,
    serviceAccount,
}: Omit<Context, 'ktUserContext'>): Promise<ServiceAccountKeys> => {
    const organizationKeyPair = getOrganizationKeyPair(
        organizationKey,
        c('Error').t`Unlock your organization key to assign managers.`
    );
    const { Member, address } = await getServiceAccountMember(api, serviceAccount);
    const memberUserKeys = await getDecryptedServiceAccountUserKeys(Member, organizationKeyPair);
    // Only the service account address is needed, so other member addresses are never decrypted.
    let addressKeys: DecryptedAddressKey[];
    try {
        addressKeys = await getDecryptedAddressKeys(address.Keys, memberUserKeys, '', organizationKeyPair);
    } catch (error) {
        await clearKeys(memberUserKeys);
        throw error;
    }
    const [primaryAddressKey, ...otherAddressKeys] = addressKeys;
    await clearKeys(otherAddressKeys);
    if (!primaryAddressKey) {
        await clearKeys(memberUserKeys);
        throw new Error(c('Error').t`The service account keys are unavailable. Please try again.`);
    }
    await clearKeys([{ publicKey: primaryAddressKey.publicKey }]);
    return { memberUserKeys, sourceAddressID: address.ID, sourceKey: primaryAddressKey.privateKey };
};

export const clearServiceAccountKeys = ({ memberUserKeys, sourceKey }: ServiceAccountKeys) =>
    clearKeys([...memberUserKeys, { privateKey: sourceKey }]);

/** Encrypt each service account user key for its manager, signed by the service account address. */
export const getServiceAccountAccessPayload = async ({
    api,
    ktUserContext,
    keys: { memberUserKeys, sourceAddressID, sourceKey },
    targetEmail,
}: Pick<Context, 'api' | 'ktUserContext'> & {
    keys: ServiceAccountKeys;
    targetEmail: string;
}): Promise<ServiceAccountAccessInput> => {
    const targetKeys = await getAndVerifyApiKeys({
        api,
        email: targetEmail,
        ktUserContext,
        internalKeysOnly: true,
        noCache: true,
    });
    const targetKey = targetKeys.addressKeys[0]?.publicKey;
    if (!targetKey) {
        throw new Error(
            c('Error').t`This manager has no encryption keys. Ask them to finish setting up their account.`
        );
    }
    const token = generateDelegatedAccessToken();
    const UserKeyToken = await getEncryptedDelegatedAccessToken({
        token,
        encryptionKeys: [targetKey],
        signingKeys: [sourceKey],
    });
    const UserKeys = await Promise.all(
        memberUserKeys.map(async ({ ID, privateKey }) => ({
            UserKeyID: ID,
            PrivateKey: await CryptoProxy.exportPrivateKey({ privateKey, passphrase: token }),
        }))
    );
    return { TargetEmail: targetEmail, SourceAddressID: sourceAddressID, UserKeyToken, UserKeys };
};
