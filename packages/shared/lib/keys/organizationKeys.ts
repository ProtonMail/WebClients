import { c } from 'ttag';

import type { PrivateKeyReference, PublicKeyReference, SessionKey } from '@proton/crypto';
import { CryptoProxy, VERIFICATION_STATUS } from '@proton/crypto';
import { arrayToHexString } from '@proton/crypto/lib/utils';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { getAndVerifyApiKeys } from '@proton/shared/lib/api/helpers/getAndVerifyApiKeys';
import { decryptKeyPacket, encryptAndSignKeyPacket } from '@proton/shared/lib/keys/keypacket';
import { computeKeyPassword, generateKeySalt } from '@proton/srp';
import isTruthy from '@proton/utils/isTruthy';

import type { UpdateOrganizationKeysPayloadLegacy, UpdateOrganizationKeysPayloadV2 } from '../api/organization';
import type {
    Address,
    Api,
    KTUserContext,
    KeyGenConfig,
    KeyPair,
    Member,
    OrganizationKey,
    PasswordlessOrganizationKey,
    VerifyOutboundPublicKeys,
} from '../interfaces';
import { encryptAddressKeyToken, generateAddressKey, getAddressKeyToken } from './addressKeys';
import { getPrimaryKey } from './getPrimaryKey';
import { splitKeys } from './keys';
import { decryptMemberToken, encryptMemberToken, generateMemberToken } from './memberToken';

export const ORGANIZATION_SIGNATURE_CONTEXT = {
    SHARE_ORGANIZATION_KEY_TOKEN: 'account.key-token.organization',
    ORG_KEY_FINGERPRINT_SIGNATURE_CONTEXT: 'account.organization-fingerprint',
};

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
    keyGenConfig: KeyGenConfig;
}

export const generateOrganizationKeys = async ({
    keyPassword,
    backupPassword,
    keyGenConfig,
}: GenerateOrganizationKeysArguments) => {
    const privateKey = await CryptoProxy.generateKey({
        userIDs: [{ name: ORGANIZATION_USERID, email: ORGANIZATION_USERID }],
        ...keyGenConfig,
    });
    const privateKeyArmored = await CryptoProxy.exportPrivateKey({ privateKey: privateKey, passphrase: keyPassword });
    return {
        privateKey,
        privateKeyArmored,
        ...(await getBackupKeyData({ backupPassword, organizationKey: privateKey })),
    };
};

export const generateOrganizationKeyToken = async (userKey: PrivateKeyReference) => {
    const randomBytes = crypto.getRandomValues(new Uint8Array(32));
    const token = arrayToHexString(randomBytes);
    return encryptAddressKeyToken({
        token,
        userKey,
        context: { value: ORGANIZATION_SIGNATURE_CONTEXT.SHARE_ORGANIZATION_KEY_TOKEN, critical: true },
    });
};

export const generatePasswordlessOrganizationKey = async ({
    userKey,
    keyGenConfig,
}: {
    userKey: PrivateKeyReference;
    keyGenConfig: KeyGenConfig;
}) => {
    if (!userKey) {
        throw new Error('Missing primary user key');
    }
    const { token, encryptedToken, signature } = await generateOrganizationKeyToken(userKey);
    const privateKey = await CryptoProxy.generateKey({
        userIDs: [{ name: ORGANIZATION_USERID, email: ORGANIZATION_USERID }],
        ...keyGenConfig,
    });
    const privateKeyArmored = await CryptoProxy.exportPrivateKey({ privateKey: privateKey, passphrase: token });
    return {
        privateKey,
        privateKeyArmored,
        encryptedToken,
        signature,
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
    publicMembers: { member: Member; memberAddresses: Address[] }[];
    oldOrganizationKey: KeyPair;
    newOrganizationKey: KeyPair;
}

export const getReEncryptedPublicMemberTokensPayloadV2 = async ({
    publicMembers = [],
    oldOrganizationKey,
    newOrganizationKey,
}: ReEncryptOrganizationTokens): Promise<UpdateOrganizationKeysPayloadV2['Members']> => {
    const run = async ({ member, memberAddresses }: { member: Member; memberAddresses: Address[] }) => {
        if (!member.Keys?.length) {
            return;
        }

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

        return {
            ID: member.ID,
            UserKeyTokens: memberKeysAndReEncryptedTokens.map(({ ID, token }) => {
                return {
                    ID,
                    Token: token,
                };
            }),
            AddressKeyTokens,
        };
    };

    const result = await Promise.all(publicMembers.map(run));

    return result.filter(isTruthy);
};

export const getReEncryptedPublicMemberTokensPayloadLegacy = async ({
    publicMembers = [],
    oldOrganizationKey,
    newOrganizationKey,
}: ReEncryptOrganizationTokens) => {
    let result: UpdateOrganizationKeysPayloadLegacy['Tokens'] = [];

    // Performed iteratively to not spam the API
    for (const { member, memberAddresses } of publicMembers) {
        if (!member.Keys?.length) {
            continue;
        }
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
 * @param keyGenConfig - The selected encryption config.
 */
interface GenerateMemberAddressKeyArguments {
    email: string;
    primaryKey: PrivateKeyReference;
    organizationKey: PrivateKeyReference;
    keyGenConfig: KeyGenConfig;
}

export const generateMemberAddressKey = async ({
    email,
    primaryKey,
    organizationKey,
    keyGenConfig,
}: GenerateMemberAddressKeyArguments) => {
    const memberKeyToken = generateMemberToken();
    const orgKeyToken = generateMemberToken();

    const { privateKey, privateKeyArmored } = await generateAddressKey({
        email,
        passphrase: memberKeyToken,
        keyGenConfig,
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

export const getIsPasswordless = (orgKey?: OrganizationKey): orgKey is PasswordlessOrganizationKey => {
    return !!orgKey && (orgKey.Passwordless || (!!orgKey.Signature && !!orgKey.Token && !!orgKey.PrivateKey));
};

export const reencryptOrganizationToken = async ({
    Token,
    decryptionKeys,
    encryptionKey,
    signingKey,
}: {
    Token: string;
    decryptionKeys: PrivateKeyReference[];
    encryptionKey: PublicKeyReference;
    signingKey: PrivateKeyReference;
}) => {
    const { sessionKey, message } = await decryptKeyPacket({ armoredMessage: Token, decryptionKeys });
    return encryptAndSignKeyPacket({
        sessionKey,
        binaryData: message.data,
        encryptionKey,
        signingKey,
        context: { value: ORGANIZATION_SIGNATURE_CONTEXT.SHARE_ORGANIZATION_KEY_TOKEN, critical: true },
    });
};

export const verifyOrganizationTokenSignature = async ({
    armoredSignature,
    binaryData,
    verificationKeys,
}: {
    armoredSignature: string;
    binaryData: Uint8Array;
    verificationKeys: PublicKeyReference[];
}) => {
    const result = await CryptoProxy.verifyMessage({
        armoredSignature,
        binaryData,
        verificationKeys,
        context: { value: ORGANIZATION_SIGNATURE_CONTEXT.SHARE_ORGANIZATION_KEY_TOKEN, required: true },
    });

    if (result.verified !== VERIFICATION_STATUS.SIGNED_AND_VALID) {
        const error = new Error(c('Error').t`Signature verification failed`);
        error.name = 'SignatureError';
        throw error;
    }
};

export const acceptInvitation = async ({
    Token,
    Signature,
    verificationKeys,
    decryptionKeys,
    encryptionKey,
}: {
    Token: string;
    Signature: string;
    verificationKeys: PublicKeyReference[];
    decryptionKeys: PrivateKeyReference[];
    encryptionKey: PrivateKeyReference;
}) => {
    const { sessionKey, message } = await decryptKeyPacket({
        armoredMessage: Token,
        decryptionKeys,
    });
    await verifyOrganizationTokenSignature({
        armoredSignature: Signature,
        binaryData: message.data,
        verificationKeys,
    });
    return encryptAndSignKeyPacket({
        sessionKey,
        binaryData: message.data,
        encryptionKey: encryptionKey,
        signingKey: encryptionKey,
        context: { value: ORGANIZATION_SIGNATURE_CONTEXT.SHARE_ORGANIZATION_KEY_TOKEN, critical: true },
    });
};

export const getVerifiedPublicKeys = async ({
    api,
    email,
    verifyOutboundPublicKeys,
    userContext,
}: {
    email: string;
    api: Api;
    verifyOutboundPublicKeys: VerifyOutboundPublicKeys;
    userContext: KTUserContext | undefined;
}) => {
    if (!email) {
        throw new Error('Missing email');
    }

    const { addressKeys } = await getAndVerifyApiKeys({
        api,
        email,
        verifyOutboundPublicKeys,
        userContext,
        internalKeysOnly: false,
        noCache: true,
    });

    return addressKeys;
};

export const generatePrivateMemberInvitation = async ({
    signer,
    data,
    member,
    publicKey,
    addressID,
}: {
    signer: {
        privateKey: PrivateKeyReference;
        addressID: string;
    };
    data: {
        sessionKey: SessionKey;
        binaryData: Uint8Array;
    };
    member: Member;
    addressID: string;
    publicKey: PublicKeyReference;
}) => {
    const result = await encryptAndSignKeyPacket({
        sessionKey: data.sessionKey,
        binaryData: data.binaryData,
        encryptionKey: publicKey,
        signingKey: signer.privateKey,
        context: { value: ORGANIZATION_SIGNATURE_CONTEXT.SHARE_ORGANIZATION_KEY_TOKEN, critical: true },
    });
    return {
        MemberID: member.ID,
        TokenKeyPacket: result.keyPacket,
        Signature: result.signature,
        SignatureAddressID: signer.addressID,
        EncryptionAddressID: addressID,
    };
};

export const generatePublicMemberInvitation = async ({
    member,
    data,
    privateKey,
}: {
    member: Member;
    privateKey: PrivateKeyReference;
    data: {
        sessionKey: SessionKey;
        binaryData: Uint8Array;
    };
}) => {
    const result = await encryptAndSignKeyPacket({
        sessionKey: data.sessionKey,
        binaryData: data.binaryData,
        encryptionKey: privateKey,
        signingKey: privateKey,
        context: { value: ORGANIZATION_SIGNATURE_CONTEXT.SHARE_ORGANIZATION_KEY_TOKEN, critical: true },
    });
    return {
        MemberID: member.ID,
        TokenKeyPacket: result.keyPacket,
        Signature: result.signature,
    };
};

export const generateOrganizationKeySignature = async ({
    signingKeys,
    organizationKey,
}: {
    signingKeys: PrivateKeyReference;
    organizationKey: PrivateKeyReference;
}) => {
    const [fingerprint] = await CryptoProxy.getSHA256Fingerprints({ key: organizationKey });
    const signature = await CryptoProxy.signMessage({
        signingKeys,
        detached: true,
        textData: fingerprint,
        context: { value: ORGANIZATION_SIGNATURE_CONTEXT.ORG_KEY_FINGERPRINT_SIGNATURE_CONTEXT, critical: true },
    });
    return signature;
};

export const validateOrganizationKeySignature = async ({
    armoredSignature,
    verificationKeys,
    organizationKey,
}: {
    armoredSignature: string;
    verificationKeys: PublicKeyReference[];
    organizationKey: PublicKeyReference;
}) => {
    const [fingerprint] = await CryptoProxy.getSHA256Fingerprints({ key: organizationKey });
    const result = await CryptoProxy.verifyMessage({
        armoredSignature,
        textData: fingerprint,
        verificationKeys,
        context: { value: ORGANIZATION_SIGNATURE_CONTEXT.ORG_KEY_FINGERPRINT_SIGNATURE_CONTEXT, required: true },
    });

    if (result.verified !== VERIFICATION_STATUS.SIGNED_AND_VALID) {
        const error = new Error(c('Error').t`Signature verification failed`);
        error.name = 'SignatureError';
        throw error;
    }
};

export enum OrganizationSignatureState {
    publicKeys,
    valid,
    error,
}

export const validateOrganizationSignatureHelper = async ({
    email,
    privateKey,
    armoredSignature,
    verifyOutboundPublicKeys,
    api,
}: {
    email: string;
    privateKey: PrivateKeyReference;
    armoredSignature: string;
    verifyOutboundPublicKeys: VerifyOutboundPublicKeys;
    api: Api;
}) => {
    const silentApi = getSilentApi(api);

    const adminEmailPublicKeys = (
        await getVerifiedPublicKeys({
            api: silentApi,
            email,
            verifyOutboundPublicKeys,
            // In app context, can use default
            userContext: undefined,
        })
    ).map(({ publicKey }) => publicKey);

    if (!adminEmailPublicKeys.length) {
        return {
            state: OrganizationSignatureState.publicKeys,
        };
    }

    try {
        await validateOrganizationKeySignature({
            verificationKeys: adminEmailPublicKeys,
            organizationKey: privateKey,
            armoredSignature,
        });
        return {
            state: OrganizationSignatureState.valid,
        };
    } catch (e) {
        return {
            state: OrganizationSignatureState.error,
        };
    }
};
