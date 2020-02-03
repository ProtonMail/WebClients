import { encryptMessage, encryptPrivateKey, generateKey, OpenPGPKey } from 'pmcrypto';
// @ts-ignore - pm-srp does not have typings, todo
import { computeKeyPassword, generateKeySalt } from 'pm-srp';

import { generateAddressKey } from './keys';
import { decryptMemberToken, encryptMemberToken, generateMemberToken } from './memberToken';
import { Member, EncryptionConfig, Address } from '../interfaces';

export const getBackupKeyData = async ({
    backupPassword,
    organizationKey
}: {
    backupPassword: string;
    organizationKey: OpenPGPKey;
}) => {
    const backupKeySalt = generateKeySalt();
    const backupKeyPassword = await computeKeyPassword(backupPassword, backupKeySalt);
    const backupArmoredPrivateKey = await encryptPrivateKey(organizationKey, backupKeyPassword);

    return {
        backupKeySalt,
        backupArmoredPrivateKey
    };
};

interface GenerateOrganizationKeysArguments {
    keyPassword: string;
    backupPassword: string;
    encryptionConfig: EncryptionConfig;
}
export const generateOrganizationKeys = async ({
    keyPassword,
    backupPassword,
    encryptionConfig
}: GenerateOrganizationKeysArguments) => {
    const { key: privateKey, privateKeyArmored } = await generateKey({
        userIds: [{ name: 'not_for_email_use@domain.tld', email: 'not_for_email_use@domain.tld' }],
        passphrase: keyPassword,
        ...encryptionConfig
    });

    await privateKey.decrypt(keyPassword);

    return {
        privateKey,
        privateKeyArmored,
        ...(await getBackupKeyData({ backupPassword, organizationKey: privateKey }))
    };
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
    newOrganizationKey
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
                publicKeys: newOrganizationPublicKey
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
    encryptionConfig
}: GenerateMemberAddressKeyArguments) => {
    const memberKeyToken = generateMemberToken();
    const orgKeyToken = generateMemberToken();

    const { privateKey, privateKeyArmored } = await generateAddressKey({
        email,
        passphrase: memberKeyToken,
        encryptionConfig
    });

    const privateKeyArmoredOrganization = await encryptPrivateKey(privateKey, orgKeyToken);

    const [activationToken, organizationToken] = await Promise.all([
        encryptMemberToken(memberKeyToken, primaryKey),
        encryptMemberToken(orgKeyToken, organizationKey)
    ]);

    return {
        privateKey,
        privateKeyArmored,
        activationToken,
        privateKeyArmoredOrganization,
        organizationToken
    };
};
