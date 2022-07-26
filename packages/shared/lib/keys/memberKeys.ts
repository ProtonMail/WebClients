import { CryptoProxy, PrivateKeyReference } from '@proton/crypto';
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
import { getHasMemberMigratedAddressKeys } from './keyMigration';
import { MEMBER_PRIVATE } from '../constants';

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
}

export const setupMemberKeyLegacy = async ({
    api,
    member,
    memberAddresses,
    password,
    organizationKey,
    encryptionConfig,
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

            const newActiveKey = await getActiveKeyObject(privateKey, { ID: 'tmp', primary: 1 });
            const updatedActiveKeys = [newActiveKey];
            const SignedKeyList = await getSignedKeyList(updatedActiveKeys);

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

            const newActiveKey = await getActiveKeyObject(addressPrivateKey, { ID: 'tmp', primary: 1 });
            const updatedActiveKeys = [newActiveKey];
            const SignedKeyList = await getSignedKeyList(updatedActiveKeys);

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
    const { privateKey, activationToken, privateKeyArmored, privateKeyArmoredOrganization, organizationToken } =
        await generateMemberAddressKey({
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
    memberUserKey: PrivateKeyReference;
    organizationKey: PrivateKeyReference;
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
