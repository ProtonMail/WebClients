import { decryptPrivateKey, encryptPrivateKey, OpenPGPKey } from 'pmcrypto';
import {
    EncryptionConfig,
    Address as tsAddress,
    Api,
    Member as tsMember,
    DecryptedKey,
    Key as tsKey,
} from '../interfaces';
import { generateKeySaltAndPassphrase } from './keys';
import { generateAddressKey, generateAddressKeyTokens } from './addressKeys';
import { decryptMemberToken, encryptMemberToken, generateMemberToken } from './memberToken';
import { getActiveKeyObject, getActiveKeys, getPrimaryFlag } from './getActiveKeys';
import { getSignedKeyList } from './signedKeyList';
import { srpVerify } from '../srp';
import { createMemberKeyRoute, setupMemberKeyRoute } from '../api/memberKeys';
import { generateMemberAddressKey } from './organizationKeys';
import { generateUserKey } from './userKeys';
import { hasAddressKeyMigration } from '../constants';
import { getHasMigratedAddressKeys } from './keyMigration';

export const getDecryptedMemberKey = async ({ Token, PrivateKey }: tsKey, organizationKey: OpenPGPKey) => {
    if (!Token) {
        throw new Error('Member token invalid');
    }
    const decryptedToken = await decryptMemberToken(Token, organizationKey);
    return decryptPrivateKey(PrivateKey, decryptedToken);
};

interface SetupMemberKeySharedArgumentsS {
    api: Api;
    member: tsMember;
    address: tsAddress;
    password: string;
    organizationKey: OpenPGPKey;
    encryptionConfig: EncryptionConfig;
}

export const setupMemberKeyLegacy = async ({
    api,
    member,
    address,
    password,
    organizationKey,
    encryptionConfig,
}: SetupMemberKeySharedArgumentsS) => {
    const { salt: keySalt, passphrase: memberMailboxPassword } = await generateKeySaltAndPassphrase(password);

    const { privateKey, privateKeyArmored } = await generateAddressKey({
        email: address.Email,
        passphrase: memberMailboxPassword,
        encryptionConfig,
    });

    const memberKeyToken = generateMemberToken();
    const privateKeyArmoredOrganization = await encryptPrivateKey(privateKey, memberKeyToken);
    const organizationToken = await encryptMemberToken(memberKeyToken, organizationKey);

    const newActiveKey = await getActiveKeyObject(privateKey, { ID: 'tmp', primary: 1 });
    const updatedActiveKeys = [newActiveKey];
    const SignedKeyList = await getSignedKeyList(updatedActiveKeys);

    const PrimaryKey = {
        UserKey: privateKeyArmored,
        MemberKey: privateKeyArmoredOrganization,
        Token: organizationToken,
    };

    const {
        Member: {
            Keys: [Key],
        },
    } = await srpVerify({
        api,
        credentials: { password },
        config: setupMemberKeyRoute({
            MemberID: member.ID,
            AddressKeys: [
                {
                    AddressID: address.ID,
                    SignedKeyList,
                    ...PrimaryKey,
                },
            ],
            PrimaryKey,
            KeySalt: keySalt,
        }),
    });

    newActiveKey.ID = Key.ID;

    return updatedActiveKeys;
};

export const setupMemberKeyV2 = async ({
    api,
    member,
    address,
    password,
    organizationKey,
    encryptionConfig,
}: SetupMemberKeySharedArgumentsS) => {
    const { salt: keySalt, passphrase: memberKeyPassword } = await generateKeySaltAndPassphrase(password);

    const { privateKey: userPrivateKey, privateKeyArmored: userPrivateKeyArmored } = await generateUserKey({
        passphrase: memberKeyPassword,
        encryptionConfig,
    });

    const memberKeyToken = generateMemberToken();
    const privateKeyArmoredOrganization = await encryptPrivateKey(userPrivateKey, memberKeyToken);
    const organizationToken = await encryptMemberToken(memberKeyToken, organizationKey);

    const { token, signature, organizationSignature, encryptedToken } = await generateAddressKeyTokens(
        userPrivateKey,
        organizationKey
    );

    const { privateKey: addressPrivateKey, privateKeyArmored: addressPrivateKeyArmored } = await generateAddressKey({
        email: address.Email,
        passphrase: token,
        encryptionConfig,
    });

    const newActiveKey = await getActiveKeyObject(addressPrivateKey, { ID: 'tmp', primary: 1 });
    const updatedActiveKeys = [newActiveKey];
    const SignedKeyList = await getSignedKeyList(updatedActiveKeys);

    const {
        Member: {
            Keys: [Key],
        },
    } = await srpVerify({
        api,
        credentials: { password },
        config: setupMemberKeyRoute({
            MemberID: member.ID,
            AddressKeys: [
                {
                    AddressID: address.ID,
                    SignedKeyList,
                    PrivateKey: addressPrivateKeyArmored,
                    Token: encryptedToken,
                    Signature: signature,
                    OrgSignature: organizationSignature,
                },
            ],
            UserKey: {
                PrivateKey: userPrivateKeyArmored,
                OrgPrivateKey: privateKeyArmoredOrganization,
                OrgToken: organizationToken,
            },
            KeySalt: keySalt,
        }),
    });

    newActiveKey.ID = Key.ID;

    return updatedActiveKeys;
};

interface SetupMemberKeyArguments extends SetupMemberKeySharedArgumentsS {
    ownerAddresses: tsAddress[];
}
export const setupMemberKey = async ({ ownerAddresses, ...rest }: SetupMemberKeyArguments) => {
    if (hasAddressKeyMigration || getHasMigratedAddressKeys(ownerAddresses)) {
        return setupMemberKeyV2(rest);
    }
    return setupMemberKeyLegacy(rest);
};

interface CreateMemberAddressKeysLegacyArguments {
    api: Api;
    member: tsMember;
    memberAddress: tsAddress;
    memberAddressKeys: DecryptedKey[];
    memberUserKey: OpenPGPKey;
    organizationKey: OpenPGPKey;
    encryptionConfig: EncryptionConfig;
}

export const createMemberAddressKeysLegacy = async ({
    api,
    member,
    memberAddress,
    memberAddressKeys,
    memberUserKey,
    organizationKey,
    encryptionConfig,
}: CreateMemberAddressKeysLegacyArguments) => {
    const {
        privateKey,
        activationToken,
        privateKeyArmored,
        privateKeyArmoredOrganization,
        organizationToken,
    } = await generateMemberAddressKey({
        email: memberAddress.Email,
        primaryKey: memberUserKey,
        organizationKey,
        encryptionConfig,
    });

    const activeKeys = await getActiveKeys(memberAddress.SignedKeyList, memberAddress.Keys, memberAddressKeys);
    const newActiveKey = await getActiveKeyObject(privateKey, { ID: 'tmp', primary: getPrimaryFlag(activeKeys) });
    const updatedActiveKeys = [...activeKeys, newActiveKey];
    const SignedKeyList = await getSignedKeyList(updatedActiveKeys);

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
    memberUserKey: OpenPGPKey;
    organizationKey: OpenPGPKey;
    encryptionConfig: EncryptionConfig;
}

export const createMemberAddressKeysV2 = async ({
    api,
    member,
    memberAddress,
    memberAddressKeys,
    memberUserKey,
    organizationKey,
    encryptionConfig,
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

    const activeKeys = await getActiveKeys(memberAddress.SignedKeyList, memberAddress.Keys, memberAddressKeys);
    const newActiveKey = await getActiveKeyObject(addressPrivateKey, {
        ID: 'tmp',
        primary: getPrimaryFlag(activeKeys),
    });
    const updatedActiveKeys = [...activeKeys, newActiveKey];
    const SignedKeyList = await getSignedKeyList(updatedActiveKeys);

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
