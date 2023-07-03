import { CryptoProxy, PrivateKeyReference } from '@proton/crypto';
import { getDefaultKeyFlags } from '@proton/shared/lib/keys/keyFlags';

import { createMemberKeyRoute, setupMemberKeyRoute } from '../api/memberKeys';
import { MEMBER_PRIVATE } from '../constants';
import {
    Api,
    DecryptedKey,
    EncryptionConfig,
    KeyTransparencyVerify,
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
import { getSignedKeyList } from './signedKeyList';
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
    encryptionConfig: EncryptionConfig;
    keyTransparencyVerify: KeyTransparencyVerify;
}

export const setupMemberKeyLegacy = async ({
    api,
    member,
    memberAddresses,
    password,
    organizationKey,
    encryptionConfig,
    keyTransparencyVerify,
}: SetupMemberKeySharedArguments) => {
    const { salt: keySalt, passphrase: memberMailboxPassword } = await generateKeySaltAndPassphrase(password);

    const AddressKeys = await Promise.all(
        memberAddresses.map(async (address) => {
            const { privateKey, privateKeyArmored } = await generateAddressKey({
                email: address.Email,
                passphrase: memberMailboxPassword,
                encryptionConfig,
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
            const SignedKeyList = await getSignedKeyList(updatedActiveKeys, address, keyTransparencyVerify);

            return {
                AddressID: address.ID,
                SignedKeyList,
                UserKey: privateKeyArmored,
                MemberKey: privateKeyArmoredOrganization,
                Token: organizationToken,
            };
        })
    );

    const PrimaryKey = {
        UserKey: AddressKeys[0].UserKey,
        MemberKey: AddressKeys[0].MemberKey,
        Token: AddressKeys[0].Token,
    };

    await srpVerify({
        api,
        credentials: { password },
        config: setupMemberKeyRoute({
            MemberID: member.ID,
            AddressKeys,
            PrimaryKey,
            KeySalt: keySalt,
        }),
    });
};

export const setupMemberKeyV2 = async ({
    api,
    member,
    memberAddresses,
    password,
    organizationKey,
    encryptionConfig,
    keyTransparencyVerify,
}: SetupMemberKeySharedArguments) => {
    const { salt: keySalt, passphrase: memberKeyPassword } = await generateKeySaltAndPassphrase(password);

    const { privateKey: userPrivateKey, privateKeyArmored: userPrivateKeyArmored } = await generateUserKey({
        passphrase: memberKeyPassword,
        encryptionConfig,
    });
    const memberKeyToken = generateMemberToken();
    const privateKeyArmoredOrganization = await CryptoProxy.exportPrivateKey({
        privateKey: userPrivateKey,
        passphrase: memberKeyToken,
    });
    const organizationToken = await encryptMemberToken(memberKeyToken, organizationKey);

    const AddressKeys = await Promise.all(
        memberAddresses.map(async (address) => {
            const { token, signature, organizationSignature, encryptedToken } = await generateAddressKeyTokens(
                userPrivateKey,
                organizationKey
            );

            const { privateKey: addressPrivateKey, privateKeyArmored: addressPrivateKeyArmored } =
                await generateAddressKey({
                    email: address.Email,
                    passphrase: token,
                    encryptionConfig,
                });

            const newActiveKey = await getActiveKeyObject(addressPrivateKey, {
                ID: 'tmp',
                primary: 1,
                flags: getDefaultKeyFlags(address),
            });
            const updatedActiveKeys = getNormalizedActiveKeys(address, [newActiveKey]);
            const SignedKeyList = await getSignedKeyList(updatedActiveKeys, address, keyTransparencyVerify);

            return {
                AddressID: address.ID,
                SignedKeyList,
                PrivateKey: addressPrivateKeyArmored,
                Token: encryptedToken,
                Signature: signature,
                OrgSignature: organizationSignature,
            };
        })
    );

    await srpVerify({
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
};

export const getShouldSetupMemberKeys = (member: tsMember | undefined) => {
    return !member?.Self && member?.Keys.length === 0 && member.Private === MEMBER_PRIVATE.READABLE;
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
    encryptionConfig: EncryptionConfig;
    keyTransparencyVerify: KeyTransparencyVerify;
}

export const createMemberAddressKeysLegacy = async ({
    api,
    member,
    memberAddress,
    memberAddressKeys,
    memberUserKey,
    organizationKey,
    encryptionConfig,
    keyTransparencyVerify,
}: CreateMemberAddressKeysLegacyArguments) => {
    const { privateKey, activationToken, privateKeyArmored, privateKeyArmoredOrganization, organizationToken } =
        await generateMemberAddressKey({
            email: memberAddress.Email,
            primaryKey: memberUserKey,
            organizationKey,
            encryptionConfig,
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
    const SignedKeyList = await getSignedKeyList(updatedActiveKeys, memberAddress, keyTransparencyVerify);

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
    encryptionConfig: EncryptionConfig;
    keyTransparencyVerify: KeyTransparencyVerify;
}

export const createMemberAddressKeysV2 = async ({
    api,
    member,
    memberAddress,
    memberAddressKeys,
    memberUserKey,
    organizationKey,
    encryptionConfig,
    keyTransparencyVerify,
}: CreateMemberAddressKeysV2Arguments) => {
    const { token, signature, organizationSignature, encryptedToken } = await generateAddressKeyTokens(
        memberUserKey,
        organizationKey
    );

    const { privateKey: addressPrivateKey, privateKeyArmored: addressPrivateKeyArmored } = await generateAddressKey({
        email: memberAddress.Email,
        passphrase: token,
        encryptionConfig,
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
    const SignedKeyList = await getSignedKeyList(updatedActiveKeys, memberAddress, keyTransparencyVerify);

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

    newActiveKey.ID = MemberKey.ID;

    return updatedActiveKeys;
};
