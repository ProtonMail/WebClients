import { decryptPrivateKey, encryptPrivateKey, generateKey, OpenPGPKey, reformatKey } from 'pmcrypto';
import { computeKeyPassword, generateKeySalt } from '@proton/srp';

import { queryAddresses } from '../api/members';
import { encryptAddressKeyToken, generateAddressKey, getAddressKeyToken } from './addressKeys';
import { decryptMemberToken, encryptMemberToken, generateMemberToken } from './memberToken';
import { Member, EncryptionConfig, KeyPair, Api, Address } from '../interfaces';
import { getPrimaryKey } from './getPrimaryKey';
import isTruthy from '../helpers/isTruthy';
import { splitKeys } from './keys';
import { UpdateOrganizationKeysPayloadLegacy, UpdateOrganizationKeysPayloadV2 } from '../api/organization';

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
    api: Api;
    publicMembers: Member[];
    oldOrganizationKey: KeyPair;
    newOrganizationKey: KeyPair;
}

export const getReEncryptedPublicMemberTokensPayloadV2 = async ({
    api,
    publicMembers = [],
    oldOrganizationKey,
    newOrganizationKey,
}: ReEncryptOrganizationTokens) => {
    const result: UpdateOrganizationKeysPayloadV2['Members'] = [];

    // Performed iteratively to not spam the API
    for (const member of publicMembers) {
        if (member.Keys.length === 0) {
            continue;
        }

        const memberAddresses = await api<{ Addresses: Address[] }>(queryAddresses(member.ID)).then(
            ({ Addresses }) => Addresses || []
        );

        const memberKeysAndReEncryptedTokens = await Promise.all(
            member.Keys.map(async ({ Token, PrivateKey, ID }) => {
                if (!Token) {
                    throw new Error('Missing token');
                }
                const memberKeyToken = await decryptMemberToken(
                    Token,
                    [oldOrganizationKey.privateKey],
                    [oldOrganizationKey.publicKey]
                );
                const reEncryptedMemberKeyToken = await encryptMemberToken(
                    memberKeyToken,
                    newOrganizationKey.privateKey
                );
                const privateKey = await decryptPrivateKey(PrivateKey, memberKeyToken);
                return {
                    ID,
                    privateKey,
                    publicKey: privateKey.toPublic(),
                    token: reEncryptedMemberKeyToken,
                };
            })
        );
        const memberUserKeys = splitKeys(memberKeysAndReEncryptedTokens);

        const primaryMemberUserKey = getPrimaryKey(memberKeysAndReEncryptedTokens)?.privateKey;
        if (!primaryMemberUserKey) {
            throw new Error('Missing primary private user key');
        }

        const AddressKeyTokens = (
            await Promise.all(
                memberAddresses.map(async (address) => {
                    const result = await Promise.all(
                        address.Keys.map(async ({ ID, Token, Signature, PrivateKey }) => {
                            if (!Token) {
                                throw new Error('Missing token');
                            }
                            const token = await getAddressKeyToken({
                                Token,
                                Signature,
                                organizationKey: oldOrganizationKey,
                                privateKeys: memberUserKeys.privateKeys,
                                publicKeys: memberUserKeys.publicKeys,
                            });
                            await decryptPrivateKey(PrivateKey, token); // To ensure it can get decrypted with this token.
                            const result = await encryptAddressKeyToken({
                                token,
                                organizationKey: newOrganizationKey.privateKey,
                                userKey: primaryMemberUserKey,
                            });
                            return {
                                ID,
                                Token: result.encryptedToken,
                                Signature: result.signature,
                                OrgSignature: result.organizationSignature!,
                            };
                        })
                    );
                    if (!result.length) {
                        return;
                    }
                    return result;
                })
            )
        )
            .filter(isTruthy)
            .flat();

        result.push({
            ID: member.ID,
            UserKeyTokens: memberKeysAndReEncryptedTokens.map(({ ID, token }) => {
                return {
                    ID,
                    Token: token,
                };
            }),
            AddressKeyTokens,
        });
    }

    return result;
};

export const getReEncryptedPublicMemberTokensPayloadLegacy = async ({
    publicMembers = [],
    api,
    oldOrganizationKey,
    newOrganizationKey,
}: ReEncryptOrganizationTokens) => {
    let result: UpdateOrganizationKeysPayloadLegacy['Tokens'] = [];

    // Performed iteratively to not spam the API
    for (const member of publicMembers) {
        const memberAddresses = await api<{ Addresses: [] }>(queryAddresses(member.ID)).then(
            ({ Addresses }) => Addresses || []
        );
        const memberUserAndAddressKeys = memberAddresses.reduce((acc, { Keys: AddressKeys }) => {
            return acc.concat(AddressKeys);
        }, member.Keys);

        const memberResult = await Promise.all(
            memberUserAndAddressKeys.map(async ({ ID, Token }) => {
                if (!Token) {
                    throw new Error('Missing Token, should never happen');
                }
                const memberKeyToken = await decryptMemberToken(
                    Token,
                    [oldOrganizationKey.privateKey],
                    [oldOrganizationKey.publicKey]
                );
                const reEncryptedMemberKeyToken = await encryptMemberToken(
                    memberKeyToken,
                    newOrganizationKey.privateKey
                );
                return { ID, Token: reEncryptedMemberKeyToken };
            })
        );

        result = result.concat(memberResult);
    }

    return result;
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
