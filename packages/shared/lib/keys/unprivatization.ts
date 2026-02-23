import { c } from 'ttag';

import type { PrivateKeyReference, PublicKeyReference } from '@proton/crypto';
import { CryptoProxy, VERIFICATION_STATUS } from '@proton/crypto';
import { fetchSignedKeyLists } from '@proton/key-transparency';
import { getAndVerifyApiKeys } from '@proton/shared/lib/api/helpers/getAndVerifyApiKeys';
import { decryptKeyPacket, encryptAndSignKeyPacket } from '@proton/shared/lib/keys/keypacket';
import { encryptMemberToken } from '@proton/shared/lib/keys/memberToken';
import type { OrganizationKeyActivation } from '@proton/shared/lib/keys/organizationKeyDto';
import noop from '@proton/utils/noop';

import { setupKeys } from '../api/keys';
import type {
    Address,
    Api,
    CachedOrganizationKey,
    DecryptedKey,
    KTUserContext,
    Member,
    MemberInvitationData,
    MemberReadyForAutomaticUnprivatization,
    MemberReadyForManualUnprivatization,
    MemberUnprivatization,
    MemberUnprivatizationAcceptState,
    MemberUnprivatizationAutomaticApproveState,
    MemberUnprivatizationManualApproveState,
    MemberUnprivatizationOutput,
    PrivateMemberUnprivatizationOutput,
    PublicMemberUnprivatizationOutput,
    Unwrap,
} from '../interfaces';
import { MemberUnprivatizationState } from '../interfaces';
import { srpVerify } from '../srp';
import {
    generatePublicMemberActivation,
    getDecryptedOrganizationKeyTokenData,
    getIsPasswordless,
    getVerifiedPublicKeys,
    validateOrganizationKeySignature,
} from './organizationKeys';
import type { ResetAddressKeysPayload } from './resetKeys';

export const MEMBER_SIGNATURE_CONTEXT = {
    INVITATION_DATA_SIGNATURE_CONTEXT: 'account.unprivatization-invitation-data',
    KEY_TOKEN_SIGNATURE_CONTEXT: 'account.key-token.user-unprivatization',
};

export const parseInvitationData = (data: string): MemberInvitationData => {
    return JSON.parse(data);
};

export const serializeInvitationData = (data: MemberInvitationData) => {
    return JSON.stringify(data);
};

export const getInvitationData = async ({
    address,
    api,
    expectRevisionChange,
    admin,
}: {
    address: string;
    api: Api;
    expectRevisionChange?: boolean;
    admin?: boolean;
}) => {
    let revision = 1;
    try {
        const result = await fetchSignedKeyLists(api, 0, address);
        const last = result[result.length - 1];
        revision = last.Revision + (expectRevisionChange ? 1 : 0);
    } catch {}
    return serializeInvitationData({
        Address: address,
        Revision: revision,
        Admin: admin,
    });
};

export const getSignedInvitationData = async (signingKey: PrivateKeyReference, textData: string) => {
    return CryptoProxy.signMessage({
        textData, // stripTrailingSpaces: false,
        signingKeys: [signingKey],
        detached: true,
        signatureContext: {
            value: MEMBER_SIGNATURE_CONTEXT.INVITATION_DATA_SIGNATURE_CONTEXT,
            critical: true,
        },
    });
};

const generateActivationToken = () => {
    const randomBytes = crypto.getRandomValues(new Uint8Array(32));
    return randomBytes.toHex();
};

const getDecryptedOrganizationActivationToken = async ({
    armoredMessage,
    verificationKeys,
    decryptionKeys,
}: {
    armoredMessage: string;
    verificationKeys: PublicKeyReference[] | null;
    decryptionKeys: PrivateKeyReference[];
}) => {
    const { data: decryptedToken, verificationStatus } = await CryptoProxy.decryptMessage({
        armoredMessage,
        decryptionKeys,
        // No verification in Global SSO case
        ...(verificationKeys
            ? {
                  verificationKeys,
                  signatureContext: {
                      value: MEMBER_SIGNATURE_CONTEXT.KEY_TOKEN_SIGNATURE_CONTEXT,
                      required: true,
                  },
              }
            : {}),
    });

    if (verificationKeys !== null && verificationStatus !== VERIFICATION_STATUS.SIGNED_AND_VALID) {
        const error = new Error(c('Error').t`Signature verification failed`);
        error.name = 'SignatureError';
        throw error;
    }

    return decryptedToken;
};

const getEncryptedOrganizationActivationToken = async ({
    token,
    signingKeys,
    encryptionKeys,
}: {
    token: string;
    signingKeys: PrivateKeyReference[];
    encryptionKeys: PublicKeyReference[];
}) => {
    const { message } = await CryptoProxy.encryptMessage({
        textData: token,
        encryptionKeys,
        signingKeys,
        signatureContext: { value: MEMBER_SIGNATURE_CONTEXT.KEY_TOKEN_SIGNATURE_CONTEXT, critical: true },
    });
    return message;
};

export const validateInvitationData = async ({
    textData,
    armoredSignature,
    verificationKeys,
}: {
    textData: string;
    armoredSignature: string;
    verificationKeys: PublicKeyReference[];
}) => {
    const result = await CryptoProxy.verifyMessage({
        armoredSignature,
        textData,
        verificationKeys,
        signatureContext: { value: MEMBER_SIGNATURE_CONTEXT.INVITATION_DATA_SIGNATURE_CONTEXT, required: true },
    });

    if (result.verificationStatus !== VERIFICATION_STATUS.SIGNED_AND_VALID) {
        const error = new Error(c('Error').t`Signature verification failed`);
        error.name = 'SignatureError';
        throw error;
    }

    return result;
};

export const validateInvitationDataValues = async ({
    invitationData,
    invitationAddress,
    options,
}: {
    invitationData: MemberInvitationData;
    invitationAddress: Address;
    options: {
        validateRevision: boolean;
        newMemberCreation: boolean;
    };
}) => {
    if (options.validateRevision) {
        const revision = (invitationAddress.SignedKeyList?.Revision ?? 0) + (options.newMemberCreation ? 1 : 0);
        if (revision !== invitationData.Revision) {
            throw new Error('Invalid invitation signed key list revision state');
        }
    }
};

export const parseUnprivatizationData = async ({
    unprivatizationData,
    addresses,
}: {
    unprivatizationData: MemberUnprivatizationOutput;
    addresses: Address[];
}): Promise<
    | { type: 'private'; payload: { unprivatizationData: PrivateMemberUnprivatizationOutput } }
    | {
          type: 'public';
          payload: {
              orgPublicKey: PublicKeyReference;
              invitationData: MemberInvitationData;
              unprivatizationData: PublicMemberUnprivatizationOutput;
              invitationAddress: Address;
          };
      }
    | {
          type: 'gsso';
          payload: {
              orgPublicKey: PublicKeyReference;
              unprivatizationData: PublicMemberUnprivatizationOutput;
              invitationAddress: Address;
          };
      }
> => {
    if (unprivatizationData.PrivateIntent) {
        return {
            type: 'private',
            payload: {
                unprivatizationData,
            },
        };
    }
    const { OrgPublicKey, InvitationData } = unprivatizationData;
    const orgPublicKey = await CryptoProxy.importPublicKey({ armoredKey: OrgPublicKey });

    if (InvitationData === null) {
        const invitationAddress = addresses.at(0);
        if (!invitationAddress) {
            throw new Error('Invalid invitation address');
        }
        return {
            type: 'gsso',
            payload: {
                orgPublicKey,
                invitationAddress,
                unprivatizationData,
            },
        };
    }

    const invitationData = parseInvitationData(InvitationData);
    const invitationEmail = invitationData.Address;

    const invitationAddress = addresses.find(({ Email }) => Email === invitationEmail);
    if (!invitationAddress) {
        throw new Error('Invalid invitation address');
    }

    return {
        type: 'public',
        payload: {
            orgPublicKey,
            invitationData,
            invitationAddress,
            unprivatizationData,
        },
    };
};
export type ParsedUnprivatizationData = Unwrap<ReturnType<typeof parseUnprivatizationData>>;

export const validateUnprivatizationData = async ({
    api,
    ktUserContext,
    parsedUnprivatizationData,
    options,
}: {
    api: Api;
    ktUserContext: KTUserContext;
    parsedUnprivatizationData: ParsedUnprivatizationData;
    options: Parameters<typeof validateInvitationDataValues>[0]['options'];
}) => {
    if (parsedUnprivatizationData.type === 'private') {
        return;
    }

    const {
        orgPublicKey,
        unprivatizationData: { AdminEmail, InvitationData, InvitationSignature, OrgKeyFingerprintSignature },
        invitationAddress,
    } = parsedUnprivatizationData.payload;
    const verifiedPublicKeysResult = await getVerifiedPublicKeys({
        api,
        email: AdminEmail,
        ktUserContext,
    }).catch(noop);
    if (!verifiedPublicKeysResult) {
        throw new Error('Unable to fetch public keys of admin');
    }

    const verifiedPublicKeys = verifiedPublicKeysResult.map(({ publicKey }) => publicKey);

    await validateOrganizationKeySignature({
        organizationKey: orgPublicKey,
        armoredSignature: OrgKeyFingerprintSignature,
        verificationKeys: verifiedPublicKeys,
    });

    // There is no invitation data in the global sso case so we can stop here
    if (parsedUnprivatizationData.type === 'gsso') {
        return;
    }

    await validateInvitationData({
        textData: InvitationData,
        armoredSignature: InvitationSignature,
        verificationKeys: [orgPublicKey],
    });

    const invitationData = parsedUnprivatizationData.payload.invitationData;

    await validateInvitationDataValues({
        invitationAddress,
        invitationData,
        options,
    });
};

export const acceptUnprivatization = async ({
    userKeys,
    addressKeys,
    parsedUnprivatizationData,
}: {
    parsedUnprivatizationData: ParsedUnprivatizationData;
    userKeys: PrivateKeyReference[];
    addressKeys: PrivateKeyReference[];
}) => {
    if (parsedUnprivatizationData.type === 'private') {
        return;
    }
    const token = generateActivationToken();
    const { orgPublicKey } = parsedUnprivatizationData.payload;
    const orgActivationToken = await getEncryptedOrganizationActivationToken({
        token,
        encryptionKeys: [orgPublicKey],
        signingKeys: addressKeys,
    });
    const orgPrimaryUserKeysArmored = await Promise.all(
        userKeys.map((userKey) => {
            return CryptoProxy.exportPrivateKey({
                privateKey: userKey,
                passphrase: token,
            });
        })
    );
    return {
        OrgUserKeys: orgPrimaryUserKeysArmored,
        OrgActivationToken: orgActivationToken,
    };
};

export const setupKeysWithUnprivatization = async ({
    payload,
    api,
    password,
    parsedUnprivatizationData,
}: {
    payload: Omit<ResetAddressKeysPayload, 'onSKLPublishSuccess'> & {
        salt: string;
        encryptedDeviceSecret?: string;
    };
    api: Api;
    password: string;
    parsedUnprivatizationData: ParsedUnprivatizationData;
}) => {
    const product = 'generic';

    if (parsedUnprivatizationData.type === 'public' || parsedUnprivatizationData.type === 'gsso') {
        const { orgPublicKey } = parsedUnprivatizationData.payload;
        const token = generateActivationToken();
        const primaryUserKey = payload.privateKeys.userKey;
        const addressKeys = payload.privateKeys.addressKeys.map(({ privateKey }) => privateKey);
        const orgActivationToken = await getEncryptedOrganizationActivationToken({
            token,
            encryptionKeys: [orgPublicKey],
            signingKeys: addressKeys,
        });
        const orgPrimaryUserKeyArmored = await CryptoProxy.exportPrivateKey({
            privateKey: primaryUserKey,
            passphrase: token,
        });

        const input = {
            KeySalt: payload.salt,
            PrimaryKey: payload.userKeyPayload,
            AddressKeys: payload.addressKeysPayload,
            OrgActivationToken: orgActivationToken,
            OrgPrimaryUserKey: orgPrimaryUserKeyArmored,
            ...(payload.encryptedDeviceSecret ? { EncryptedSecret: payload.encryptedDeviceSecret } : {}),
        } as const;

        await srpVerify({
            api,
            credentials: { password },
            config: setupKeys(input, product),
        });
    } else if (parsedUnprivatizationData.type === 'private') {
        await srpVerify({
            api,
            credentials: { password },
            config: setupKeys(
                {
                    KeySalt: payload.salt,
                    PrimaryKey: payload.userKeyPayload,
                    AddressKeys: payload.addressKeysPayload,
                    ...(payload.encryptedDeviceSecret ? { EncryptedSecret: payload.encryptedDeviceSecret } : {}),
                },
                product
            ),
        });
    } else {
        throw new Error('Unknown type');
    }
};

export const reencryptAddressKeyToken = async ({
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
    });
};

interface UnprivatizeMemberUserKeyDto {
    OrgPrivateKey: string;
    OrgToken: string;
}

interface UnprivatizeMemberAddressKeyDto {
    AddressKeyID: string;
    OrgSignature: string;
    OrgTokenKeyPacket: string;
}

export interface UnprivatizeMemberPayload {
    UserKeys: UnprivatizeMemberUserKeyDto[];
    AddressKeys: UnprivatizeMemberAddressKeyDto[];
    OrganizationKeyActivation?: OrganizationKeyActivation;
}

export const getIsMemberUnprivatizationInAutomaticApproveState = (
    unprivatizationData: MemberUnprivatization | null
): unprivatizationData is MemberUnprivatizationAutomaticApproveState => {
    return Boolean(
        unprivatizationData?.State === MemberUnprivatizationState.Ready &&
        !unprivatizationData.PrivateIntent &&
        unprivatizationData.InvitationData &&
        unprivatizationData.InvitationSignature &&
        unprivatizationData.ActivationToken &&
        (unprivatizationData.PrivateKeys?.length || 0) > 0
    );
};

export const getIsMemberUnprivatizationInManualApproveState = (
    unprivatizationData: MemberUnprivatization | null
): unprivatizationData is MemberUnprivatizationManualApproveState => {
    return Boolean(
        unprivatizationData?.State === MemberUnprivatizationState.Ready &&
        !unprivatizationData.PrivateIntent &&
        !unprivatizationData.InvitationData &&
        !unprivatizationData.InvitationSignature &&
        unprivatizationData.ActivationToken &&
        (unprivatizationData.PrivateKeys?.length || 0) > 0
    );
};

export const getIsMemberUnprivatizationInManualAcceptState = (
    unprivatizationData: MemberUnprivatization | null
): unprivatizationData is MemberUnprivatizationAcceptState => {
    return Boolean(
        unprivatizationData?.State === MemberUnprivatizationState.Pending &&
        !unprivatizationData.PrivateIntent &&
        unprivatizationData.InvitationData &&
        unprivatizationData.InvitationSignature &&
        !unprivatizationData.ActivationToken &&
        !unprivatizationData.PrivateKeys?.length
    );
};

export const getIsMemberInAutomaticApproveState = (
    member: Member
): member is MemberReadyForAutomaticUnprivatization => {
    return getIsMemberUnprivatizationInAutomaticApproveState(member.Unprivatization);
};

export const getIsMemberInManualApproveState = (member: Member): member is MemberReadyForManualUnprivatization => {
    return getIsMemberUnprivatizationInManualApproveState(member.Unprivatization);
};

export const getIsMemberInManualAcceptState = (member: Member): member is MemberReadyForManualUnprivatization => {
    return getIsMemberUnprivatizationInManualAcceptState(member.Unprivatization);
};

export const unprivatizeMemberHelper = async ({
    admin,
    data: { ActivationToken, PrivateKeys },
    verificationKeys,
    organizationKey,
    userKeys,
    memberAddresses,
}: {
    admin?: boolean;
    data: {
        ActivationToken: string;
        PrivateKeys: string[];
    };
    memberAddresses: Address[];
    userKeys: DecryptedKey[];
    verificationKeys: PublicKeyReference[] | null;
    organizationKey?: CachedOrganizationKey;
}): Promise<UnprivatizeMemberPayload> => {
    if (!organizationKey?.privateKey) {
        throw new Error('Invalid requirements');
    }
    const organizationPrivateKey = organizationKey.privateKey;
    const token = await getDecryptedOrganizationActivationToken({
        armoredMessage: ActivationToken,
        decryptionKeys: [organizationPrivateKey],
        verificationKeys,
    });
    const memberUserPrivateKeys = await Promise.all(
        PrivateKeys.map((privateKey) => {
            return CryptoProxy.importPrivateKey({
                armoredKey: privateKey,
                passphrase: token,
            });
        })
    );

    const newMemberKeyToken = generateActivationToken();
    const armoredMemberUserPrivateKeys = await Promise.all(
        memberUserPrivateKeys.map((userPrivateKey) => {
            return CryptoProxy.exportPrivateKey({
                privateKey: userPrivateKey,
                passphrase: newMemberKeyToken,
            });
        })
    );
    const organizationToken = await encryptMemberToken(newMemberKeyToken, organizationPrivateKey);

    const memberUserKeys = armoredMemberUserPrivateKeys.map(
        (armoredUserPrivateKey): UnprivatizeMemberUserKeyDto => ({
            OrgPrivateKey: armoredUserPrivateKey,
            OrgToken: organizationToken,
        })
    );

    const memberAddressKeys = (
        await Promise.all(
            memberAddresses.map((memberAddress) => {
                return Promise.all(
                    memberAddress.Keys.map(async (memberAddressKey): Promise<UnprivatizeMemberAddressKeyDto> => {
                        if (!memberAddressKey.Token) {
                            throw new Error('Missing token');
                        }
                        const result = await reencryptAddressKeyToken({
                            Token: memberAddressKey.Token,
                            decryptionKeys: memberUserPrivateKeys,
                            encryptionKey: organizationPrivateKey,
                            signingKey: organizationPrivateKey,
                        });
                        return {
                            AddressKeyID: memberAddressKey.ID,
                            OrgSignature: result.signature,
                            OrgTokenKeyPacket: result.keyPacket,
                        };
                    })
                );
            })
        )
    ).flat();

    let OrganizationKeyActivation: OrganizationKeyActivation | undefined;
    if (admin && getIsPasswordless(organizationKey.Key)) {
        const primaryMemberUserPrivateKey = memberUserPrivateKeys[0];
        const data = await getDecryptedOrganizationKeyTokenData({
            armoredMessage: organizationKey.Key.Token,
            decryptionKeys: userKeys.map(({ privateKey }) => privateKey),
        });
        OrganizationKeyActivation = await generatePublicMemberActivation({
            privateKey: primaryMemberUserPrivateKey,
            data,
        });
    }

    return {
        UserKeys: memberUserKeys,
        AddressKeys: memberAddressKeys,
        OrganizationKeyActivation,
    };
};

export class UnprivatizationRevisionError extends Error {}

export const getUnprivatizeMemberPayload = async ({
    api,
    member,
    memberAddresses,
    userKeys,
    organizationKey,
    ktUserContext,
    options = {
        ignoreRevisionCheck: false,
    },
}: {
    api: Api;
    member: MemberReadyForAutomaticUnprivatization;
    memberAddresses: Address[];
    userKeys: DecryptedKey[];
    organizationKey?: CachedOrganizationKey;
    ktUserContext: KTUserContext;
    options?: {
        ignoreRevisionCheck: boolean;
    };
}): Promise<UnprivatizeMemberPayload> => {
    if (!organizationKey?.privateKey) {
        throw new Error('Invalid requirements');
    }
    const unprivatizationData = member.Unprivatization;
    const { InvitationData, InvitationSignature, ActivationToken, PrivateKeys } = unprivatizationData;
    await validateInvitationData({
        textData: InvitationData,
        armoredSignature: InvitationSignature,
        verificationKeys: [organizationKey.privateKey],
    });
    const data = parseInvitationData(InvitationData);

    const verifiedApiKeys = await getAndVerifyApiKeys({
        api,
        email: data.Address,
        ktUserContext,
        internalKeysOnly: false,
        noCache: true,
    }).catch(noop);

    if (!verifiedApiKeys) {
        throw new Error('Unable to fetch public keys');
    }
    if (!options.ignoreRevisionCheck && verifiedApiKeys.Address.SignedKeyList?.Revision !== data.Revision) {
        throw new UnprivatizationRevisionError('Unexpected revision');
    }
    const verifiedPublicKeys = verifiedApiKeys.addressKeys.map(({ publicKey }) => publicKey);

    return unprivatizeMemberHelper({
        admin: data.Admin,
        data: {
            ActivationToken,
            PrivateKeys,
        },
        memberAddresses,
        verificationKeys: verifiedPublicKeys,
        organizationKey,
        userKeys,
    });
};
