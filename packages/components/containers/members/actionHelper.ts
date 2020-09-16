import { encryptPrivateKey, OpenPGPKey } from 'pmcrypto';
import { addKeyAction } from 'proton-shared/lib/keys/keysAction';
import { generateMemberToken, encryptMemberToken } from 'proton-shared/lib/keys/memberToken';
import { getDefaultKeyFlags } from 'proton-shared/lib/keys/keyFlags';
import { createMemberKeyRoute, setupMemberKeyRoute } from 'proton-shared/lib/api/memberKeys';
import getSignedKeyList from 'proton-shared/lib/keys/getSignedKeyList';
import { srpVerify } from 'proton-shared/lib/srp';
import { generateAddressKey, generateKeySaltAndPassphrase } from 'proton-shared/lib/keys/keys';
import {
    EncryptionConfig,
    Address as tsAddress,
    ActionableKey,
    Api,
    CachedKey,
    Member as tsMember,
} from 'proton-shared/lib/interfaces';

interface SetupMemberKeyArguments {
    api: Api;
    Member: tsMember;
    Address: tsAddress;
    password: string;
    organizationKey: OpenPGPKey;
    encryptionConfig: EncryptionConfig;
}
export const setupMemberKey = async ({
    api,
    Member,
    Address,
    password,
    organizationKey,
    encryptionConfig,
}: SetupMemberKeyArguments) => {
    const { salt: keySalt, passphrase: memberMailboxPassword } = await generateKeySaltAndPassphrase(password);

    const { privateKey, privateKeyArmored } = await generateAddressKey({
        email: Address.Email,
        passphrase: memberMailboxPassword,
        encryptionConfig,
    });

    const memberKeyToken = generateMemberToken();
    const privateKeyArmoredOrganization = await encryptPrivateKey(privateKey, memberKeyToken);
    const organizationToken = await encryptMemberToken(memberKeyToken, organizationKey);

    const updatedKeys = addKeyAction({
        ID: 'temp',
        flags: getDefaultKeyFlags(),
        privateKey,
        parsedKeys: [],
        actionableKeys: [],
    });

    const newKey = updatedKeys.find(({ ID }) => ID === 'temp');
    if (!newKey) {
        throw new Error('Temp key not found');
    }

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
            MemberID: Member.ID,
            AddressKeys: [
                {
                    AddressID: Address.ID,
                    SignedKeyList: await getSignedKeyList(updatedKeys, privateKey),
                    ...PrimaryKey,
                },
            ],
            PrimaryKey,
            KeySalt: keySalt,
        }),
    });

    newKey.ID = Key.ID;

    return updatedKeys;
};

interface CreateMemberAddressKeysArguments {
    api: Api;
    Address: tsAddress;
    Member: tsMember;
    parsedKeys: CachedKey[];
    actionableKeys: ActionableKey[];
    privateKey: OpenPGPKey;
    signingKey: OpenPGPKey;
    privateKeyArmored: string;
    activationToken: string;
    privateKeyArmoredOrganization: string;
    organizationToken: string;
}
export const createMemberAddressKeys = async ({
    api,
    Address,
    Member,
    parsedKeys,
    actionableKeys,
    privateKey,
    signingKey,
    privateKeyArmored,
    activationToken,
    privateKeyArmoredOrganization,
    organizationToken,
}: CreateMemberAddressKeysArguments) => {
    const newKeys = addKeyAction({
        parsedKeys,
        actionableKeys,
        ID: 'temp',
        flags: getDefaultKeyFlags(),
        privateKey,
    });

    const newKey = newKeys.find(({ ID }) => ID === 'temp');
    if (!newKey) {
        throw new Error('Temp key not found');
    }
    const { primary } = newKey;

    const { MemberKey } = await api(
        createMemberKeyRoute({
            MemberID: Member.ID,
            AddressID: Address.ID,
            Activation: activationToken,
            UserKey: privateKeyArmored,
            Token: organizationToken,
            MemberKey: privateKeyArmoredOrganization,
            Primary: primary,
            SignedKeyList: await getSignedKeyList(newKeys, signingKey),
        })
    );

    newKey.ID = MemberKey.ID;

    return newKeys;
};
