import { CryptoProxy, PrivateKeyReference } from '@proton/crypto';
import { getDefaultKeyFlags } from '@proton/shared/lib/keys/keyFlags';

import { createMemberKeyRoute, setupMemberKeyRoute } from '../api/memberKeys';
import { MEMBER_PRIVATE } from '../constants';
import {
    Api,
    CachedOrganizationKey,
    DecryptedKey,
    KeyGenConfig,
    KeyTransparencyVerify,
    UserModel,
    Address as tsAddress,
    Key as tsKey,
    Member as tsMember,
} from '../interfaces';
import { srpVerify } from '../srp';
import { generateAddressKey, generateAddressKeyTokens } from './addressKeys';
import { getActiveKeyObject, getActiveKeys, getNormalizedActiveKeys, getPrimaryFlag } from './getActiveKeys';
import { getHasMemberMigratedAddressKeys } from './keyMigration';
import { generateKeySaltAndPassphrase } from './keys';
import { decryptMemberToken, encryptMemberToken, generateMemberToken } from './memberToken';
import { generateMemberAddressKey } from './organizationKeys';
import { getSignedKeyListWithDeferredPublish } from './signedKeyList';
import { generateUserKey } from './userKeys';

export const getDecryptedMemberKey = async ({ Token, PrivateKey }: tsKey, organizationKey: PrivateKeyReference) => {
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
    keyGenConfig: KeyGenConfig;
    keyTransparencyVerify: KeyTransparencyVerify;
}

export const setupMemberKeyLegacy = async ({
    api,
    member,
    memberAddresses,
    password,
    organizationKey,
    keyGenConfig,
    keyTransparencyVerify,
}: SetupMemberKeySharedArguments) => {
    const { salt: keySalt, passphrase: memberMailboxPassword } = await generateKeySaltAndPassphrase(password);

    const addressKeysWithOnSKLPublish = await Promise.all(
        memberAddresses.map(async (address) => {
            const { privateKey, privateKeyArmored } = await generateAddressKey({
                email: address.Email,
                passphrase: memberMailboxPassword,
                keyGenConfig,
            });

            const memberKeyToken = generateMemberToken();
            const privateKeyArmoredOrganization = await CryptoProxy.exportPrivateKey({
                privateKey,
                passphrase: memberKeyToken,
            });
            const organizationToken = await encryptMemberToken(memberKeyToken, organizationKey);

            const newActiveKey = await getActiveKeyObject(privateKey, {
                ID: 'tmp',
                primary: 1,
                flags: getDefaultKeyFlags(address),
            });
            const updatedActiveKeys = getNormalizedActiveKeys(address, [newActiveKey]);
            const [SignedKeyList, onSKLPublishSuccess] = await getSignedKeyListWithDeferredPublish(
                updatedActiveKeys,
                address,
                keyTransparencyVerify
            );
            return {
                addressKey: {
                    AddressID: address.ID,
                    SignedKeyList,
                    UserKey: privateKeyArmored,
                    MemberKey: privateKeyArmoredOrganization,
                    Token: organizationToken,
                },
                privateKey,
                onSKLPublishSuccess,
            };
        })
    );

    const primary = addressKeysWithOnSKLPublish[0];
    const PrimaryKey = {
        UserKey: primary.addressKey.UserKey,
        MemberKey: primary.addressKey.MemberKey,
        Token: primary.addressKey.Token,
    };

    const { Member } = await srpVerify<{ Member: tsMember }>({
        api,
        credentials: { password },
        config: setupMemberKeyRoute({
            MemberID: member.ID,
            AddressKeys: addressKeysWithOnSKLPublish.map(({ addressKey }) => addressKey),
            PrimaryKey,
            KeySalt: keySalt,
        }),
    });

    await Promise.all(
        addressKeysWithOnSKLPublish.map(({ onSKLPublishSuccess }) =>
            onSKLPublishSuccess ? onSKLPublishSuccess() : Promise.resolve()
        )
    );

    return { Member, userPrivateKey: primary.privateKey };
};

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

            const newActiveKey = await getActiveKeyObject(addressPrivateKey, {
                ID: 'tmp',
                primary: 1,
                flags: getDefaultKeyFlags(address),
            });
            const updatedActiveKeys = getNormalizedActiveKeys(address, [newActiveKey]);
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
    return member?.Private === MEMBER_PRIVATE.READABLE && !member.SSO;
};

export const getShouldSetupMemberKeys = (member: tsMember | undefined) => {
    return !member?.Self && member?.Keys.length === 0 && getCanGenerateMemberKeys(member);
};

export const getCanGenerateMemberKeysPermissions = (
    user: UserModel,
    organizationKey: CachedOrganizationKey | undefined
) => {
    return !!organizationKey?.privateKey && user.isAdmin && !user.isSubUser;
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
    // During member key setup, no address has keys, so we ignore checking it
    if (getHasMemberMigratedAddressKeys([], ownerAddresses)) {
        return setupMemberKeyV2(rest);
    }
    return setupMemberKeyLegacy(rest);
};

interface CreateMemberAddressKeysLegacyArguments {
    api: Api;
    member: tsMember;
    memberAddress: tsAddress;
    memberAddressKeys: DecryptedKey[];
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

    const activeKeys = await getActiveKeys(
        memberAddress,
        memberAddress.SignedKeyList,
        memberAddress.Keys,
        memberAddressKeys
    );
    const newActiveKey = await getActiveKeyObject(privateKey, {
        ID: 'tmp',
        primary: getPrimaryFlag(activeKeys),
        flags: getDefaultKeyFlags(memberAddress),
    });
    const updatedActiveKeys = getNormalizedActiveKeys(memberAddress, [...activeKeys, newActiveKey]);
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
    memberAddressKeys: DecryptedKey[];
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

    const activeKeys = await getActiveKeys(
        memberAddress,
        memberAddress.SignedKeyList,
        memberAddress.Keys,
        memberAddressKeys
    );
    const newActiveKey = await getActiveKeyObject(addressPrivateKey, {
        ID: 'tmp',
        primary: getPrimaryFlag(activeKeys),
        flags: getDefaultKeyFlags(memberAddress),
    });
    const updatedActiveKeys = getNormalizedActiveKeys(memberAddress, [...activeKeys, newActiveKey]);
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
