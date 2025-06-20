import type { PrivateKeyReference } from '@proton/crypto';
import { CryptoProxy, toPublicKeyReference } from '@proton/crypto';
import { getDecryptedAddressKeys } from '@proton/shared/lib/keys/getDecryptedAddressKeys';
import { getDecryptedUserKeys } from '@proton/shared/lib/keys/getDecryptedUserKeys';
import { getPrimaryKey } from '@proton/shared/lib/keys/getPrimaryKey';
import { getDefaultKeyFlags } from '@proton/shared/lib/keys/keyFlags';
import isTruthy from '@proton/utils/isTruthy';

import { createMemberKeyRoute, setupMemberKeyRoute } from '../api/memberKeys';
import { MEMBER_PRIVATE } from '../constants';
import type {
    Api,
    CachedOrganizationKey,
    DecryptedAddressKey,
    KeyGenConfig,
    KeyPair,
    KeyTransparencyVerify,
    UserModel,
    Address as tsAddress,
    Key as tsKey,
    Member as tsMember,
} from '../interfaces';
import { srpVerify } from '../srp';
import { generateAddressKey, generateAddressKeyTokens } from './addressKeys';
import {
    getActiveAddressKeys,
    getActiveKeyObject,
    getNormalizedActiveAddressKeys,
    getPrimaryFlag,
} from './getActiveKeys';
import { generateKeySaltAndPassphrase } from './keys';
import { decryptMemberToken, encryptMemberToken, generateMemberToken } from './memberToken';
import { generateMemberAddressKey } from './organizationKeys';
import { getSignedKeyListWithDeferredPublish } from './signedKeyList';
import { generateUserKey } from './userKeys';

export const getDecryptedMemberKey = async (
    { Token, PrivateKey }: tsKey,
    organizationKey: PrivateKeyReference
): Promise<PrivateKeyReference> => {
    if (!Token) {
        throw new Error('Member token invalid');
    }
    const decryptedToken = await decryptMemberToken(Token, [organizationKey], [organizationKey]);
    return CryptoProxy.importPrivateKey({ armoredKey: PrivateKey, passphrase: decryptedToken });
};

interface SetupMemberKeySharedArguments {
    api: Api;
    member: tsMember;
    memberAddresses: tsAddress[];
    password: string;
    organizationKey: PrivateKeyReference;
    keyGenConfig: KeyGenConfig; // pqc: TODO no v6 support
    keyTransparencyVerify: KeyTransparencyVerify;
}

export const setupMemberKeyV2 = async ({
    api,
    member,
    memberAddresses,
    password,
    organizationKey,
    keyGenConfig,
    keyTransparencyVerify,
}: SetupMemberKeySharedArguments) => {
    const { salt: keySalt, passphrase: memberKeyPassword } = await generateKeySaltAndPassphrase(password);

    const { privateKey: userPrivateKey, privateKeyArmored: userPrivateKeyArmored } = await generateUserKey({
        passphrase: memberKeyPassword,
        keyGenConfig,
    });
    const memberKeyToken = generateMemberToken();
    const privateKeyArmoredOrganization = await CryptoProxy.exportPrivateKey({
        privateKey: userPrivateKey,
        passphrase: memberKeyToken,
    });
    const organizationToken = await encryptMemberToken(memberKeyToken, organizationKey);

    const AddressKeysWithOnSKLPublish = await Promise.all(
        memberAddresses.map(async (address) => {
            const { token, signature, organizationSignature, encryptedToken } = await generateAddressKeyTokens(
                userPrivateKey,
                organizationKey
            );

            const { privateKey: addressPrivateKey, privateKeyArmored: addressPrivateKeyArmored } =
                await generateAddressKey({
                    email: address.Email,
                    passphrase: token,
                    keyGenConfig,
                });
            const addressPublicKey = await toPublicKeyReference(addressPrivateKey);
            const newActiveKey = await getActiveKeyObject(addressPrivateKey, addressPublicKey, {
                ID: 'tmp',
                primary: 1,
                flags: getDefaultKeyFlags(address),
            });
            const updatedActiveKeys = getNormalizedActiveAddressKeys(address, { v4: [newActiveKey], v6: [] });
            const [SignedKeyList, onSKLPublishSuccess] = await getSignedKeyListWithDeferredPublish(
                updatedActiveKeys,
                address,
                keyTransparencyVerify
            );

            return {
                addressKey: {
                    AddressID: address.ID,
                    SignedKeyList,
                    PrivateKey: addressPrivateKeyArmored,
                    Token: encryptedToken,
                    Signature: signature,
                    OrgSignature: organizationSignature,
                },
                onSKLPublishSuccess,
            };
        })
    );
    const AddressKeys = AddressKeysWithOnSKLPublish.map(({ addressKey }) => addressKey);

    const { Member } = await srpVerify<{ Member: tsMember }>({
        api,
        credentials: { password },
        config: setupMemberKeyRoute({
            MemberID: member.ID,
            AddressKeys,
            UserKey: {
                PrivateKey: userPrivateKeyArmored,
                OrgPrivateKey: privateKeyArmoredOrganization,
                OrgToken: organizationToken,
            },
            KeySalt: keySalt,
        }),
    });

    await Promise.all(
        AddressKeysWithOnSKLPublish.map(({ onSKLPublishSuccess }) =>
            onSKLPublishSuccess ? onSKLPublishSuccess() : Promise.resolve()
        )
    );

    return { Member, userPrivateKey };
};

export const getCanGenerateMemberKeys = (member: tsMember | undefined) => {
    const isReadable = member?.Private === MEMBER_PRIVATE.READABLE;
    return (
        isReadable &&
        (!member.SSO ||
            /* Keys should be generated for SSO members in case they already have keys setup */
            (member.SSO && member.Keys.length > 0))
    );
};

export const getShouldSetupMemberKeys = (member: tsMember | undefined) => {
    return (
        !member?.Self &&
        member?.Keys.length === 0 &&
        getCanGenerateMemberKeys(member) &&
        !member.SSO /* Keys should never be setup for SSO members since they set it up through the backup password screen*/
    );
};

export const getCanGenerateMemberKeysPermissions = (
    user: UserModel,
    organizationKey: CachedOrganizationKey | undefined
) => {
    return !!organizationKey?.privateKey && user.isAdmin && user.isSelf;
};

export const getCanGenerateMemberAddressKeys = ({
    user,
    member,
    organizationKey,
    address,
}: {
    user: UserModel;
    member: tsMember | undefined;
    organizationKey: CachedOrganizationKey | undefined;
    address: tsAddress;
}) => {
    /*
     * Keys can be generated if the organisation key is decrypted, and you are an admin,
     * and the member is readable, you're not an admin signed in to a readable member.
     */
    return (
        getCanGenerateMemberKeysPermissions(user, organizationKey) &&
        getCanGenerateMemberKeys(member) &&
        !address.HasKeys
    );
};

interface SetupMemberKeyArguments extends SetupMemberKeySharedArguments {
    ownerAddresses: tsAddress[];
}

export const setupMemberKeys = async ({ ownerAddresses, ...rest }: SetupMemberKeyArguments) => {
    return setupMemberKeyV2(rest);
};

interface CreateMemberAddressKeysLegacyArguments {
    api: Api;
    member: tsMember;
    memberAddress: tsAddress;
    memberAddressKeys: DecryptedAddressKey[];
    memberUserKey: PrivateKeyReference;
    organizationKey: PrivateKeyReference;
    keyGenConfig: KeyGenConfig;
    keyTransparencyVerify: KeyTransparencyVerify;
}

export const createMemberAddressKeysLegacy = async ({
    api,
    member,
    memberAddress,
    memberAddressKeys,
    memberUserKey,
    organizationKey,
    keyGenConfig,
    keyTransparencyVerify,
}: CreateMemberAddressKeysLegacyArguments) => {
    const { privateKey, activationToken, privateKeyArmored, privateKeyArmoredOrganization, organizationToken } =
        await generateMemberAddressKey({
            email: memberAddress.Email,
            primaryKey: memberUserKey,
            organizationKey,
            keyGenConfig,
        });

    const activeKeys = await getActiveAddressKeys(memberAddress.SignedKeyList, memberAddressKeys);
    const publicKey = await toPublicKeyReference(privateKey);
    const newActiveKey = await getActiveKeyObject(privateKey, publicKey, {
        ID: 'tmp',
        primary: getPrimaryFlag(activeKeys.v4),
        flags: getDefaultKeyFlags(memberAddress),
    });
    const updatedActiveKeys = getNormalizedActiveAddressKeys(memberAddress, {
        v4: [...activeKeys.v4, newActiveKey],
        v6: [],
    });
    const [SignedKeyList, onSKLPublishSuccess] = await getSignedKeyListWithDeferredPublish(
        updatedActiveKeys,
        memberAddress,
        keyTransparencyVerify
    );

    const { primary } = newActiveKey;

    const { MemberKey } = await api(
        createMemberKeyRoute({
            MemberID: member.ID,
            AddressID: memberAddress.ID,
            Activation: activationToken,
            UserKey: privateKeyArmored,
            Token: organizationToken,
            MemberKey: privateKeyArmoredOrganization,
            Primary: primary,
            SignedKeyList,
        })
    );

    await onSKLPublishSuccess();

    newActiveKey.ID = MemberKey.ID;

    return updatedActiveKeys;
};

interface CreateMemberAddressKeysV2Arguments {
    api: Api;
    member: tsMember;
    memberAddress: tsAddress;
    memberAddressKeys: DecryptedAddressKey[];
    memberUserKey: PrivateKeyReference;
    organizationKey: PrivateKeyReference;
    keyGenConfig: KeyGenConfig;
    keyTransparencyVerify: KeyTransparencyVerify;
}

export const createMemberAddressKeysV2 = async ({
    api,
    member,
    memberAddress,
    memberAddressKeys,
    memberUserKey,
    organizationKey,
    keyGenConfig,
    keyTransparencyVerify,
}: CreateMemberAddressKeysV2Arguments) => {
    const { token, signature, organizationSignature, encryptedToken } = await generateAddressKeyTokens(
        memberUserKey,
        organizationKey
    );

    const { privateKey: addressPrivateKey, privateKeyArmored: addressPrivateKeyArmored } = await generateAddressKey({
        email: memberAddress.Email,
        passphrase: token,
        keyGenConfig,
    });

    const activeKeys = await getActiveAddressKeys(memberAddress.SignedKeyList, memberAddressKeys);
    const addressPublicKey = await toPublicKeyReference(addressPrivateKey);
    const newActiveKey = await getActiveKeyObject(addressPrivateKey, addressPublicKey, {
        ID: 'tmp',
        primary: getPrimaryFlag(activeKeys.v4),
        flags: getDefaultKeyFlags(memberAddress),
    });
    const updatedActiveKeys = getNormalizedActiveAddressKeys(memberAddress, {
        v4: [...activeKeys.v4, newActiveKey],
        v6: [],
    });
    const [SignedKeyList, onSKLPublishSuccess] = await getSignedKeyListWithDeferredPublish(
        updatedActiveKeys,
        memberAddress,
        keyTransparencyVerify
    );

    const { primary } = newActiveKey;

    const { MemberKey } = await api(
        createMemberKeyRoute({
            MemberID: member.ID,
            AddressID: memberAddress.ID,
            PrivateKey: addressPrivateKeyArmored,
            Token: encryptedToken,
            Signature: signature,
            OrgSignature: organizationSignature,
            Primary: primary,
            SignedKeyList,
        })
    );

    await onSKLPublishSuccess();

    newActiveKey.ID = MemberKey.ID;

    return updatedActiveKeys;
};

export const getMemberKeys = async ({
    member,
    memberAddresses,
    organizationKey,
}: {
    member: Pick<tsMember, 'Keys'>;
    memberAddresses: tsAddress[];
    organizationKey: KeyPair;
}) => {
    const memberUserKeys = await getDecryptedUserKeys(member.Keys, '', organizationKey);
    const memberUserKeyPrimary = getPrimaryKey(memberUserKeys)?.privateKey;
    if (!memberUserKeyPrimary) {
        throw new Error('Not able to decrypt the primary member user key');
    }

    const memberAddressesKeys = (
        await Promise.all(
            memberAddresses.map(async (address) => {
                const result = {
                    address,
                    keys: await getDecryptedAddressKeys(address.Keys, memberUserKeys, '', organizationKey),
                };
                // Some non-private members don't have keys generated
                if (!result.keys.length) {
                    return;
                }
                return result;
            })
        )
    ).filter(isTruthy);

    return {
        memberUserKeyPrimary,
        memberUserKeys,
        memberAddressesKeys,
    };
};
