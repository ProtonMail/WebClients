import { c } from 'ttag';

import { CryptoProxy, PrivateKeyReference, PublicKeyReference, VERIFICATION_STATUS } from '@proton/crypto';
import { arrayToHexString } from '@proton/crypto/lib/utils';
import { fetchSignedKeyLists } from '@proton/key-transparency/lib';
import { getAndVerifyApiKeys } from '@proton/shared/lib/api/helpers/getAndVerifyApiKeys';
import { decryptKeyPacket, encryptAndSignKeyPacket } from '@proton/shared/lib/keys/keypacket';
import { encryptMemberToken } from '@proton/shared/lib/keys/memberToken';
import noop from '@proton/utils/noop';

import { setupKeys } from '../api/keys';
import {
    Address,
    Api,
    KeyTransparencyActivation,
    Member,
    MemberInvitationData,
    MemberUnprivatizationOutput,
    MemberUnprivatizationState,
    Unwrap,
    User,
    VerifyOutboundPublicKeys,
} from '../interfaces';
import { createPreAuthKTVerifier } from '../keyTransparency';
import { srpVerify } from '../srp';
import { generateKeySaltAndPassphrase } from './keys';
import { getVerifiedPublicKeys, validateOrganizationKeySignature } from './organizationKeys';
import { getResetAddressesKeysV2 } from './resetKeys';

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

export const getInvitationData = async ({ address, api }: { address: string; api: Api }) => {
    let revision = 1;
    try {
        const result = await fetchSignedKeyLists(api, 0, address);
        const last = result[result.length - 1];
        revision = last.Revision + 1;
    } catch {}
    return serializeInvitationData({
        Address: address,
        Revision: revision,
    });
};

export const getSignedInvitationData = async (signingKey: PrivateKeyReference, textData: string) => {
    return CryptoProxy.signMessage({
        textData, // stripTrailingSpaces: false,
        signingKeys: [signingKey],
        detached: true,
        context: {
            value: MEMBER_SIGNATURE_CONTEXT.INVITATION_DATA_SIGNATURE_CONTEXT,
            critical: true,
        },
    });
};

const generateActivationToken = () => {
    const randomBytes = crypto.getRandomValues(new Uint8Array(32));
    return arrayToHexString(randomBytes);
};

const getDecryptedOrganizationActivationToken = async ({
    armoredMessage,
    verificationKeys,
    decryptionKeys,
}: {
    armoredMessage: string;
    verificationKeys: PublicKeyReference[];
    decryptionKeys: PrivateKeyReference[];
}) => {
    const { data: decryptedToken, verified } = await CryptoProxy.decryptMessage({
        armoredMessage,
        decryptionKeys,
        verificationKeys,
        context: { value: MEMBER_SIGNATURE_CONTEXT.KEY_TOKEN_SIGNATURE_CONTEXT, required: true },
    });

    if (verified !== VERIFICATION_STATUS.SIGNED_AND_VALID) {
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
        context: { value: MEMBER_SIGNATURE_CONTEXT.KEY_TOKEN_SIGNATURE_CONTEXT, critical: true },
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
        context: { value: MEMBER_SIGNATURE_CONTEXT.INVITATION_DATA_SIGNATURE_CONTEXT, required: true },
    });

    if (result.verified !== VERIFICATION_STATUS.SIGNED_AND_VALID) {
        const error = new Error(c('Error').t`Signature verification failed`);
        error.name = 'SignatureError';
        throw error;
    }

    return result;
};

export const parseUnprivatizationData = async ({
    unprivatizationData: { OrgPublicKey, InvitationData },
}: {
    unprivatizationData: MemberUnprivatizationOutput;
}) => {
    const orgPublicKey = await CryptoProxy.importPublicKey({ armoredKey: OrgPublicKey });
    const invitationData = parseInvitationData(InvitationData);
    return {
        orgPublicKey,
        invitationData,
    };
};
export type ParsedUnprivatizationData = Unwrap<ReturnType<typeof parseUnprivatizationData>>;

export const validateUnprivatizationData = async ({
    api,
    verifyOutboundPublicKeys,
    unprivatizationData: { InvitationData, OrgKeyFingerprintSignature, InvitationSignature, State, AdminEmail },
    parsedUnprivatizationData: { orgPublicKey },
}: {
    unprivatizationData: MemberUnprivatizationOutput;
    api: Api;
    verifyOutboundPublicKeys: VerifyOutboundPublicKeys;
    parsedUnprivatizationData: ParsedUnprivatizationData;
}) => {
    if (State !== MemberUnprivatizationState.Pending) {
        throw new Error('Invalid member state');
    }

    const verifiedPublicKeysResult = await getVerifiedPublicKeys({
        api,
        verifyOutboundPublicKeys,
        email: AdminEmail,
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

    await validateInvitationData({
        textData: InvitationData,
        armoredSignature: InvitationSignature,
        verificationKeys: [orgPublicKey],
    });
};

export const validateInvitationDataValues = async ({
    addresses,
    invitationData,
}: {
    api: Api;
    addresses: Address[];
    invitationData: MemberInvitationData;
}) => {
    const invitationEmail = invitationData.Address;

    const invitationAddress = addresses.find(({ Email }) => Email === invitationEmail);
    if (!invitationAddress) {
        throw new Error('Invalid invitation address');
    }

    const revision = (invitationAddress.SignedKeyList?.Revision ?? 0) + 1;

    if (revision !== invitationData.Revision) {
        throw new Error('Invalid invitation signed key list revision state');
    }
};

export const setupKeysWithUnprivatization = async ({
    user,
    addresses,
    api,
    password,
    parsedUnprivatizationData: { orgPublicKey },
    ktActivation,
}: {
    user: User;
    addresses: Address[];
    api: Api;
    password: string;
    parsedUnprivatizationData: ParsedUnprivatizationData;
    ktActivation: KeyTransparencyActivation;
}) => {
    const { passphrase, salt } = await generateKeySaltAndPassphrase(password);

    const { preAuthKTVerify, preAuthKTCommit } = createPreAuthKTVerifier(ktActivation, api);

    const { privateKeys, userKeyPayload, addressKeysPayload, onSKLPublishSuccess } = await getResetAddressesKeysV2({
        addresses,
        passphrase,
        preAuthKTVerify,
    });

    if (!privateKeys || !userKeyPayload || !addressKeysPayload) {
        throw new Error('Missing keys payload');
    }

    const primaryUserKey = privateKeys.userKey;
    const addressKeys = privateKeys.addressKeys.map(({ privateKey }) => privateKey);
    const token = generateActivationToken();
    const orgActivationToken = await getEncryptedOrganizationActivationToken({
        token,
        encryptionKeys: [orgPublicKey],
        signingKeys: addressKeys,
    });
    const orgPrimaryUserKeyArmored = await CryptoProxy.exportPrivateKey({
        privateKey: primaryUserKey,
        passphrase: token,
    });

    await srpVerify({
        api,
        credentials: { password },
        config: setupKeys(
            {
                KeySalt: salt,
                PrimaryKey: userKeyPayload,
                AddressKeys: addressKeysPayload,
                OrgActivationToken: orgActivationToken,
                OrgPrimaryUserKey: orgPrimaryUserKeyArmored,
            },
            'generic'
        ),
    });

    await onSKLPublishSuccess();

    await preAuthKTCommit(user.ID);
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

export interface UnprivatizeMemberResult {
    UserKey: UnprivatizeMemberUserKeyDto;
    AddressKeys: UnprivatizeMemberAddressKeyDto[];
}

export const unprivatizeMember = async ({
    verifyOutboundPublicKeys,
    api,
    member,
    memberAddresses,
    organizationKey,
}: {
    api: Api;
    member: Member;
    memberAddresses: Address[];
    organizationKey?: PrivateKeyReference;
    verifyOutboundPublicKeys: VerifyOutboundPublicKeys;
}): Promise<UnprivatizeMemberResult> => {
    const unprivatizationData = member.Unprivatization;
    if (unprivatizationData?.State !== MemberUnprivatizationState.Ready || !organizationKey) {
        throw new Error('Invalid requirements');
    }
    const { InvitationData, InvitationSignature, ActivationToken, PrivateKey } = unprivatizationData;
    await validateInvitationData({
        textData: InvitationData,
        armoredSignature: InvitationSignature,
        verificationKeys: [organizationKey],
    });
    const data = parseInvitationData(InvitationData);

    const verifiedApiKeys = await getAndVerifyApiKeys({
        api,
        email: data.Address,
        verifyOutboundPublicKeys,
        internalKeysOnly: false,
        noCache: true,
    }).catch(noop);

    if (!verifiedApiKeys) {
        throw new Error('Unable to fetch public keys of invitee');
    }
    if (verifiedApiKeys.Address.SignedKeyList?.Revision !== data.Revision) {
        throw new Error('Unexpected revision');
    }
    const verifiedPublicKeys = verifiedApiKeys.addressKeys.map(({ publicKey }) => publicKey);

    const token = await getDecryptedOrganizationActivationToken({
        armoredMessage: ActivationToken,
        decryptionKeys: [organizationKey],
        verificationKeys: verifiedPublicKeys,
    });
    const userPrivateKey = await CryptoProxy.importPrivateKey({ armoredKey: PrivateKey, passphrase: token });

    const newMemberKeyToken = generateActivationToken(); // TODO: This or update member token 128?
    const armoredUserPrivateKey = await CryptoProxy.exportPrivateKey({
        privateKey: userPrivateKey,
        passphrase: newMemberKeyToken,
    });
    const organizationToken = await encryptMemberToken(newMemberKeyToken, organizationKey);

    const UserKey: UnprivatizeMemberUserKeyDto = {
        OrgPrivateKey: armoredUserPrivateKey,
        OrgToken: organizationToken,
    };

    const AddressKeys = (
        await Promise.all(
            memberAddresses.map(async (memberAddress) => {
                const result = await Promise.all(
                    memberAddress.Keys.map(async (memberAddressKey): Promise<UnprivatizeMemberAddressKeyDto> => {
                        if (!memberAddressKey.Token) {
                            throw new Error('Missing token');
                        }
                        const result = await reencryptAddressKeyToken({
                            Token: memberAddressKey.Token,
                            decryptionKeys: [userPrivateKey],
                            encryptionKey: organizationKey,
                            signingKey: organizationKey,
                        });
                        return {
                            AddressKeyID: memberAddressKey.ID,
                            OrgSignature: result.signature,
                            OrgTokenKeyPacket: result.keyPacket,
                        };
                    })
                );
                return result;
            })
        )
    ).flat();

    return {
        UserKey,
        AddressKeys,
    };
};
