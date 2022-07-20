import { computeKeyPassword, generateKeySalt } from '@proton/srp';
import { CryptoProxy, PrivateKeyReference } from '@proton/crypto';

import isTruthy from '@proton/utils/isTruthy';
import { getAllMemberAddresses } from '../api/members';
import { encryptAddressKeyToken, generateAddressKey, getAddressKeyToken } from './addressKeys';
import { decryptMemberToken, encryptMemberToken, generateMemberToken } from './memberToken';
import { Member, EncryptionConfig, KeyPair, Api } from '../interfaces';
import { getPrimaryKey } from './getPrimaryKey';
import { splitKeys } from './keys';
import { UpdateOrganizationKeysPayloadLegacy, UpdateOrganizationKeysPayloadV2 } from '../api/organization';

export const getBackupKeyData = async ({
    backupPassword,
    organizationKey,
}: {
    backupPassword: string;
    organizationKey: PrivateKeyReference;
}) => {
    const backupKeySalt = generateKeySalt();
    const backupKeyPassword = await computeKeyPassword(backupPassword, backupKeySalt);
    const backupArmoredPrivateKey = await CryptoProxy.exportPrivateKey({
        privateKey: organizationKey,
        passphrase: backupKeyPassword,
    });

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
    const privateKey = await CryptoProxy.generateKey({
        userIDs: [{ name: ORGANIZATION_USERID, email: ORGANIZATION_USERID }],
        ...encryptionConfig,
    });
    const privateKeyArmored = await CryptoProxy.exportPrivateKey({ privateKey: privateKey, passphrase: keyPassword });
    return {
        privateKey,
        privateKeyArmored,
        ...(await getBackupKeyData({ backupPassword, organizationKey: privateKey })),
    };
};

export const reformatOrganizationKey = async (privateKey: PrivateKeyReference, passphrase: string) => {
    const reformattedPrivateKey = await CryptoProxy.reformatKey({
        userIDs: [{ name: ORGANIZATION_USERID, email: ORGANIZATION_USERID }],
        privateKey: privateKey,
    });

    const privateKeyArmored = await CryptoProxy.exportPrivateKey({ privateKey: reformattedPrivateKey, passphrase });
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
        if (!member.Keys?.length) {
            continue;
        }

        const memberAddresses = await getAllMemberAddresses(api, member.ID);

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
                const privateKey = await CryptoProxy.importPrivateKey({
                    armoredKey: PrivateKey,
                    passphrase: memberKeyToken,
                });
                const publicKey = await CryptoProxy.importPublicKey({
                    armoredKey: await CryptoProxy.exportPublicKey({ key: privateKey }),
                });
                return {
                    ID,
                    privateKey,
                    publicKey,
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
                    if (!address.Keys?.length) {
                        return;
                    }
                    return Promise.all(
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
                            await CryptoProxy.clearKey({
                                // To ensure it can get decrypted with this token
                                key: await CryptoProxy.importPrivateKey({
                                    armoredKey: PrivateKey,
                                    passphrase: token,
                                }),
                            });
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
        if (!member.Keys?.length) {
            continue;
        }
        const memberAddresses = await getAllMemberAddresses(api, member.ID);
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
    primaryKey: PrivateKeyReference;
    organizationKey: PrivateKeyReference;
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

    const privateKeyArmoredOrganization = await CryptoProxy.exportPrivateKey({
        privateKey,
        passphrase: orgKeyToken,
    });

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
