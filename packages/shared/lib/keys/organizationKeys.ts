import { encryptMessage, encryptPrivateKey, generateKey, OpenPGPKey, reformatKey } from 'pmcrypto';
import { computeKeyPassword, generateKeySalt } from 'pm-srp';

import { generateAddressKey } from './addressKeys';
import { decryptMemberToken, encryptMemberToken, generateMemberToken } from './memberToken';
import { Member, EncryptionConfig, Address } from '../interfaces';

export const getBackupKeyData = async ({
    backupPassword,
    organizationKey,
}: {
    backupPassword: string;
    organizationKey: OpenPGPKey;
}) => {
    const backupKeySalt = generateKeySalt();
    const backupKeyPassword = await computeKeyPassword(backupPassword, backupKeySalt);
    const backupArmoredPrivateKey = await encryptPrivateKey(organizationKey, backupKeyPassword);

    return {
        backupKeySalt,
        backupArmoredPrivateKey,
    };
};

export const ORGANIZATION_USERID = 'not_for_email_use@domain.tld';

interface GenerateOrganizationKeysArguments {
    keyPassword: string;
    backupPassword: string;
    encryptionConfig: EncryptionConfig;
}

export const generateOrganizationKeys = async ({
    keyPassword,
    backupPassword,
    encryptionConfig,
}: GenerateOrganizationKeysArguments) => {
    const { key: privateKey, privateKeyArmored } = await generateKey({
        userIds: [{ name: ORGANIZATION_USERID, email: ORGANIZATION_USERID }],
        passphrase: keyPassword,
        ...encryptionConfig,
    });
    await privateKey.decrypt(keyPassword);
    return {
        privateKey,
        privateKeyArmored,
        ...(await getBackupKeyData({ backupPassword, organizationKey: privateKey })),
    };
};

export const reformatOrganizationKey = async (privateKey: OpenPGPKey, passphrase: string) => {
    const { key: reformattedPrivateKey, privateKeyArmored } = await reformatKey({
        userIds: [{ name: ORGANIZATION_USERID, email: ORGANIZATION_USERID }],
        passphrase,
        privateKey,
    });
    await reformattedPrivateKey.decrypt(passphrase);
    return { privateKey: reformattedPrivateKey, privateKeyArmored };
};

interface ReEncryptOrganizationTokens {
    nonPrivateMembers: Member[];
    nonPrivateMembersAddresses: Address[][];
    oldOrganizationKey: OpenPGPKey;
    newOrganizationKey: OpenPGPKey;
}

export const reEncryptOrganizationTokens = ({
    nonPrivateMembers = [],
    nonPrivateMembersAddresses = [],
    oldOrganizationKey,
    newOrganizationKey,
}: ReEncryptOrganizationTokens) => {
    const newOrganizationPublicKey = newOrganizationKey.toPublic();

    const getMemberTokens = ({ Keys = [] }: Member, i: number) => {
        const memberKeys = nonPrivateMembersAddresses[i].reduce((acc, { Keys: AddressKeys }) => {
            return acc.concat(AddressKeys);
        }, Keys);

        return memberKeys.map(async ({ ID, Token }) => {
            if (!Token) {
                throw new Error('Missing Token');
            }
            const decryptedToken = await decryptMemberToken(Token, oldOrganizationKey);
            const { data } = await encryptMessage({
                data: decryptedToken,
                privateKeys: newOrganizationKey,
                publicKeys: newOrganizationPublicKey,
            });

            return { ID, Token: data };
        });
    };

    return Promise.all(nonPrivateMembers.map(getMemberTokens).flat());
};

/**
 * Generate member address for non-private users.
 * It requires that the user has been set up with a primary key first.
 * @param address - The address to generate keys for.
 * @param primaryKey - The primary key of the member.
 * @param organizationKey - The organization key.
 * @param encryptionConfig - The selected encryption config.
 */
interface GenerateMemberAddressKeyArguments {
    email: string;
    primaryKey: OpenPGPKey;
    organizationKey: OpenPGPKey;
    encryptionConfig: EncryptionConfig;
}

export const generateMemberAddressKey = async ({
    email,
    primaryKey,
    organizationKey,
    encryptionConfig,
}: GenerateMemberAddressKeyArguments) => {
    const memberKeyToken = generateMemberToken();
    const orgKeyToken = generateMemberToken();

    const { privateKey, privateKeyArmored } = await generateAddressKey({
        email,
        passphrase: memberKeyToken,
        encryptionConfig,
    });

    const privateKeyArmoredOrganization = await encryptPrivateKey(privateKey, orgKeyToken);

    const [activationToken, organizationToken] = await Promise.all([
        encryptMemberToken(memberKeyToken, primaryKey),
        encryptMemberToken(orgKeyToken, organizationKey),
    ]);

    return {
        privateKey,
        privateKeyArmored,
        activationToken,
        privateKeyArmoredOrganization,
        organizationToken,
    };
};
