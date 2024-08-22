import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit';
import { c } from 'ttag';

import { CryptoProxy, type PrivateKeyReference, type PublicKeyReference } from '@proton/crypto';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { CacheType } from '@proton/redux-utilities';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { activatePasswordlessKey, updateRolePasswordless } from '@proton/shared/lib/api/members';
import {
    createPasswordlessOrganizationKeys as createPasswordlessOrganizationKeysConfig,
    migratePasswordlessOrganizationKey,
    updateOrganizationKeysLegacy,
    updateOrganizationKeysV2,
    updatePasswordlessOrganizationKeys as updatePasswordlessOrganizationKeysConfig,
    uploadOrganizationKeySignature,
} from '@proton/shared/lib/api/organization';
import { KEYGEN_CONFIGS, KEYGEN_TYPES, MEMBER_PRIVATE, MEMBER_ROLE } from '@proton/shared/lib/constants';
import { getIsAddressEnabled } from '@proton/shared/lib/helpers/address';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';
import type {
    Address,
    Api,
    CachedOrganizationKey,
    EnhancedMember,
    Member,
    VerifyOutboundPublicKeys,
} from '@proton/shared/lib/interfaces';
import { MEMBER_ORG_KEY_STATE } from '@proton/shared/lib/interfaces';
import {
    acceptInvitation,
    generateOrganizationKeySignature,
    generateOrganizationKeyToken,
    generateOrganizationKeys,
    generatePasswordlessOrganizationKey,
    generatePrivateMemberInvitation,
    generatePublicMemberInvitation,
    getDecryptedUserKeys,
    getHasMigratedAddressKeys,
    getIsPasswordless,
    getOrganizationKeyToken,
    getPrimaryKey,
    getReEncryptedPublicMemberTokensPayloadLegacy,
    getReEncryptedPublicMemberTokensPayloadV2,
    getSentryError,
    getVerifiedPublicKeys,
    splitKeys,
} from '@proton/shared/lib/keys';
import { decryptKeyPacket } from '@proton/shared/lib/keys/keypacket';
import isTruthy from '@proton/utils/isTruthy';

import { addressKeysThunk } from '../addressKeys';
import { addressesThunk } from '../addresses';
import { getMemberAddresses, membersThunk } from '../members';
import { userKeysThunk } from '../userKeys';
import { type OrganizationKeyState, organizationKeyThunk } from './index';

const keyGenConfig = KEYGEN_CONFIGS[KEYGEN_TYPES.CURVE25519];

export const getPrivateAdminError = () => {
    return c('passwordless').t`Private users can be promoted to admin when they've signed in for the first time`;
};

export const getPrivateText = () => {
    return c('unprivatization').t`Admins can't access the data of private users and can't reset their password.`;
};

export const getPublicAdminError = () => {
    return c('passwordless').t`Non-private users can be promoted to admin when they have setup keys`;
};

export const getPrivatizeError = () => {
    return c('passwordless').t`You must privatize all users before generating a new organization key`;
};

export const getOrganizationTokenThunk = (): ThunkAction<
    Promise<string>,
    OrganizationKeyState,
    ProtonThunkArguments,
    UnknownAction
> => {
    return async (dispatch, _, extra) => {
        const key = await dispatch(organizationKeyThunk());
        const userKeys = await dispatch(userKeysThunk());
        const keyPassword = extra.authentication.getPassword();
        return getOrganizationKeyToken({ userKeys, keyPassword, Key: key?.Key });
    };
};

export interface PublicMemberKeyPayload {
    type: 0;
    member: Member;
    email: string;
    address: Address | undefined;
    privateKey: PrivateKeyReference;
}

export interface PrivateMemberKeyPayload {
    type: 1;
    member: Member;
    email: string;
    address: Address;
    publicKey: PublicKeyReference;
}

export type MemberKeyPayload = PrivateMemberKeyPayload | PublicMemberKeyPayload;

export type PublicMembersReEncryptPayload = {
    member: Member;
    memberAddresses: Address[];
}[];

export interface OrganizationKeyRotationPayload {
    publicMembersToReEncryptPayload: PublicMembersReEncryptPayload;
    memberKeyPayloads: MemberKeyPayload[];
}

// Error that can be ignored when e.g. rotating org keys
class ConstraintError extends Error {}

export const getMemberKeyPayload = async ({
    organizationKey,
    api,
    mode,
    member,
    memberAddresses,
}: {
    organizationKey: CachedOrganizationKey;
    mode:
        | {
              type: 'email';
              verifyOutboundPublicKeys: VerifyOutboundPublicKeys;
          }
        | {
              type: 'org-key';
              publicKey: PublicKeyReference;
          };
    api: Api;
    member: Member;
    memberAddresses: Address[];
}): Promise<MemberKeyPayload> => {
    const address: Address | undefined = memberAddresses.filter(
        (address) => getIsAddressEnabled(address) && address.HasKeys
    )[0];

    if (member.Private === MEMBER_PRIVATE.READABLE) {
        if (!member.Keys?.length) {
            throw new ConstraintError(getPublicAdminError());
        }
        // Only needed to decrypt the user keys here.
        if (!organizationKey?.privateKey) {
            throw new Error(c('passwordless').t`Organization key must be activated to give admin privileges`);
        }
        const memberUserKeys = await getDecryptedUserKeys(member.Keys, '', organizationKey);
        const privateKey = getPrimaryKey(memberUserKeys)?.privateKey;
        if (!privateKey) {
            throw new Error('Unable to decrypt non-private user keys');
        }
        return {
            type: 0,
            member,
            address,
            email: address?.Email || member.Name,
            privateKey,
        };
    }

    if (mode.type === 'org-key') {
        return {
            type: 1,
            member,
            address: {} as any, // Unused
            email: 'unused',
            publicKey: mode.publicKey,
        };
    }

    if (!address) {
        throw new ConstraintError(getPrivateAdminError());
    }
    const email = address.Email;
    const memberPublicKey = (
        await getVerifiedPublicKeys({
            api,
            verifyOutboundPublicKeys: mode.verifyOutboundPublicKeys,
            email,
        })
    )[0]?.publicKey;
    if (!memberPublicKey) {
        throw new Error(getPrivateAdminError());
    }
    return {
        type: 1,
        member,
        address,
        email,
        publicKey: memberPublicKey,
    };
};

const getReEncryptedAdminTokens = async ({
    armoredMessage,
    decryptionKeys,
    address,
    memberKeyPayloads,
}: {
    armoredMessage: string;
    decryptionKeys: PrivateKeyReference[];
    address: { ID: string; privateKey: PrivateKeyReference };
    memberKeyPayloads: MemberKeyPayload[];
}) => {
    const { sessionKey, message } = await decryptKeyPacket({
        armoredMessage,
        decryptionKeys,
    });
    const data = {
        sessionKey,
        binaryData: message.data,
    };
    const signer = {
        addressID: address.ID,
        privateKey: address.privateKey,
    };

    const { privateAdminPromises, publicAdminPromises } = memberKeyPayloads.reduce<{
        privateAdminPromises: ReturnType<typeof generatePrivateMemberInvitation>[];
        publicAdminPromises: ReturnType<typeof generatePublicMemberInvitation>[];
    }>(
        (acc, memberPayload) => {
            if (memberPayload.type === 1) {
                const { member, publicKey, address } = memberPayload;
                acc.privateAdminPromises.push(
                    generatePrivateMemberInvitation({
                        member,
                        publicKey,
                        addressID: address.ID,
                        signer,
                        data,
                    })
                );
            } else {
                const { member, privateKey } = memberPayload;
                acc.publicAdminPromises.push(
                    generatePublicMemberInvitation({
                        member,
                        privateKey,
                        data,
                    })
                );
            }

            return acc;
        },
        { privateAdminPromises: [], publicAdminPromises: [] }
    );

    const [privateAdminInvitations, publicAdminActivations] = await Promise.all([
        Promise.all(privateAdminPromises),
        Promise.all(publicAdminPromises),
    ]);

    return { privateAdminInvitations, publicAdminActivations };
};

const getReEncryptedMemberTokens = async ({
    publicMembersToReEncryptPayload,
    newOrganizationKey,
    oldOrganizationKey,
}: {
    publicMembersToReEncryptPayload: PublicMembersReEncryptPayload;
    oldOrganizationKey: CachedOrganizationKey;
    newOrganizationKey: { privateKey: PrivateKeyReference; privateKeyArmored: string };
}): Promise<Parameters<typeof updatePasswordlessOrganizationKeysConfig>[0]['Members']> => {
    if (!publicMembersToReEncryptPayload.length) {
        return [];
    }
    if (!oldOrganizationKey?.privateKey) {
        throw new Error('Public members received without an existing organization key.');
    }
    const publicKey = await CryptoProxy.importPublicKey({ armoredKey: newOrganizationKey.privateKeyArmored });
    return getReEncryptedPublicMemberTokensPayloadV2({
        publicMembers: publicMembersToReEncryptPayload,
        oldOrganizationKey: oldOrganizationKey,
        newOrganizationKey: { privateKey: newOrganizationKey.privateKey, publicKey },
    });
};

type ConfirmPromotionMemberAction = {
    type: 'confirm-promote';
    payload: MemberKeyPayload;
    prompt: boolean;
};
type ConfirmDemotionMemberAction = {
    type: 'confirm-demote';
    payload: null;
};
export type MemberPromptAction = ConfirmPromotionMemberAction | ConfirmDemotionMemberAction;

export const getMemberEditPayload = ({
    verifyOutboundPublicKeys,
    member,
    memberDiff,
    api,
}: {
    verifyOutboundPublicKeys: VerifyOutboundPublicKeys;
    member: EnhancedMember;
    memberDiff: Partial<{
        role: MEMBER_ROLE;
    }>;
    api: Api;
}): ThunkAction<Promise<MemberPromptAction | null>, OrganizationKeyState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch) => {
        const organizationKey = await dispatch(organizationKeyThunk());
        const passwordlessMode = getIsPasswordless(organizationKey?.Key);

        if (memberDiff.role === MEMBER_ROLE.ORGANIZATION_MEMBER) {
            return {
                type: 'confirm-demote',
                payload: null,
            };
        }

        if (memberDiff.role === MEMBER_ROLE.ORGANIZATION_ADMIN && passwordlessMode) {
            const payload = await getMemberKeyPayload({
                organizationKey,
                mode: {
                    type: 'email',
                    verifyOutboundPublicKeys,
                },
                api,
                member,
                memberAddresses: await dispatch(getMemberAddresses({ member, retry: true })),
            });

            if (member.Private === MEMBER_PRIVATE.UNREADABLE) {
                return {
                    type: 'confirm-promote',
                    payload,
                    prompt: true,
                };
            }

            return {
                type: 'confirm-promote',
                payload,
                prompt: false,
            };
        }

        return null;
    };
};

export const getMemberKeyPayloads = ({
    mode,
    members,
    api,
    ignorePasswordlessValidation,
    ignoreErrors,
}: {
    mode: Parameters<typeof getMemberKeyPayload>[0]['mode'];
    members: EnhancedMember[];
    api: Api;
    ignorePasswordlessValidation?: boolean;
    ignoreErrors?: boolean;
}): ThunkAction<Promise<MemberKeyPayload[]>, OrganizationKeyState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch) => {
        const organizationKey = await dispatch(organizationKeyThunk());
        if (!organizationKey) {
            throw new Error('Org key loading');
        }
        if (!getIsPasswordless(organizationKey?.Key) && !ignorePasswordlessValidation) {
            throw new Error('Only used on passwordless organizations');
        }
        return (
            await Promise.all(
                members.map(async (member) => {
                    try {
                        return await getMemberKeyPayload({
                            member,
                            memberAddresses: await dispatch(getMemberAddresses({ member, retry: true })),
                            mode,
                            api,
                            organizationKey,
                        });
                    } catch (e) {
                        if (e instanceof ConstraintError) {
                            return undefined;
                        }
                        if (ignoreErrors) {
                            return undefined;
                        }
                        throw e;
                    }
                })
            )
        ).filter(isTruthy);
    };
};

export const getPublicMembersToReEncryptPayload = (): ThunkAction<
    Promise<PublicMembersReEncryptPayload>,
    OrganizationKeyState,
    ProtonThunkArguments,
    UnknownAction
> => {
    return async (dispatch) => {
        const organizationKey = await dispatch(organizationKeyThunk());
        const members = await dispatch(membersThunk());

        const publicMembers = members.filter((member) => member.Private === MEMBER_PRIVATE.READABLE);

        if (publicMembers.length >= 1) {
            if (!organizationKey?.privateKey) {
                throw new Error(getPrivatizeError());
            }
            const publicMembersToReEncrypt = await Promise.all(
                publicMembers.map(async (member) => {
                    if (!member.Keys?.length) {
                        return null;
                    }
                    if (!organizationKey?.privateKey) {
                        throw new Error(getPrivatizeError());
                    }
                    const memberUserKeys = await getDecryptedUserKeys(member.Keys, '', organizationKey);
                    const privateKey = getPrimaryKey(memberUserKeys)?.privateKey;
                    if (!privateKey) {
                        throw new Error('Missing private key');
                    }
                    const memberAddresses = await dispatch(getMemberAddresses({ member, retry: true }));
                    return {
                        member,
                        memberUserKeys,
                        memberAddresses,
                    };
                })
            );
            return publicMembersToReEncrypt.filter(isTruthy);
        }

        return [];
    };
};

export const getKeyRotationPayload = ({
    verifyOutboundPublicKeys,
    api,
    ignorePasswordlessValidation,
}: {
    verifyOutboundPublicKeys: VerifyOutboundPublicKeys;
    api: Api;
    ignorePasswordlessValidation?: boolean;
}): ThunkAction<Promise<OrganizationKeyRotationPayload>, OrganizationKeyState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch) => {
        const userKeys = await dispatch(userKeysThunk());
        const organizationKey = await dispatch(organizationKeyThunk());
        if (!getIsPasswordless(organizationKey?.Key) && !ignorePasswordlessValidation) {
            throw new Error('Only used on passwordless organizations');
        }
        const userKey = userKeys[0]?.privateKey;
        if (!userKey) {
            throw new Error('Missing primary user key');
        }
        const [primaryAddress] = await dispatch(addressesThunk());
        if (!primaryAddress) {
            throw new Error('Missing primary address');
        }
        const [primaryAddressKey] = await dispatch(addressKeysThunk({ addressID: primaryAddress.ID }));
        if (!primaryAddressKey) {
            throw new Error('Missing primary address key');
        }
        const members = await dispatch(membersThunk());
        const otherAdminMembers = members.filter((member) => {
            return member.Role === MEMBER_ROLE.ORGANIZATION_ADMIN && !member.Self;
        });

        const [memberKeyPayloads, publicMembersToReEncryptPayload] = await Promise.all([
            dispatch(
                getMemberKeyPayloads({
                    api,
                    mode: {
                        type: 'email',
                        verifyOutboundPublicKeys,
                    },
                    members: otherAdminMembers,
                    ignorePasswordlessValidation,
                })
            ),
            dispatch(getPublicMembersToReEncryptPayload()),
        ]);

        return {
            memberKeyPayloads,
            publicMembersToReEncryptPayload,
        };
    };
};
export const setAdminRoles = ({
    memberKeyPayloads,
    api,
}: { memberKeyPayloads: MemberKeyPayload[] } & {
    api: Api;
}): ThunkAction<Promise<void>, OrganizationKeyState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch) => {
        const userKeys = await dispatch(userKeysThunk());
        const organizationKey = await dispatch(organizationKeyThunk());
        if (!getIsPasswordless(organizationKey?.Key)) {
            throw new Error('Only used on passwordless organizations');
        }
        if (!organizationKey?.privateKey) {
            throw new Error('Organization key must be activated to set admin roles');
        }
        const userKey = userKeys[0]?.privateKey;
        if (!userKey) {
            throw new Error('Missing primary user key');
        }
        const [primaryAddress] = await dispatch(addressesThunk());
        if (!primaryAddress) {
            throw new Error('Missing primary address');
        }
        const [primaryAddressKey] = await dispatch(addressKeysThunk({ addressID: primaryAddress.ID }));
        if (!primaryAddressKey) {
            throw new Error('Missing primary address key');
        }

        const { privateAdminInvitations, publicAdminActivations } = await getReEncryptedAdminTokens({
            armoredMessage: organizationKey.Key.Token,
            decryptionKeys: userKeys.map(({ privateKey }) => privateKey),
            address: { ID: primaryAddress.ID, privateKey: primaryAddressKey.privateKey },
            memberKeyPayloads,
        });

        const privatePromise = Promise.all(
            privateAdminInvitations.map((invitation) => {
                return api(
                    updateRolePasswordless({
                        memberID: invitation.MemberID,
                        Role: MEMBER_ROLE.ORGANIZATION_ADMIN,
                        OrganizationKeyInvitation: {
                            TokenKeyPacket: invitation.TokenKeyPacket,
                            Signature: invitation.Signature,
                            SignatureAddressID: invitation.SignatureAddressID,
                            EncryptionAddressID: invitation.EncryptionAddressID,
                        },
                    })
                );
            })
        );

        const publicPromise = Promise.all(
            publicAdminActivations.map((activation) => {
                return api(
                    updateRolePasswordless({
                        memberID: activation.MemberID,
                        Role: MEMBER_ROLE.ORGANIZATION_ADMIN,
                        OrganizationKeyActivation: {
                            TokenKeyPacket: activation.TokenKeyPacket,
                            Signature: activation.Signature,
                        },
                    })
                );
            })
        );

        await Promise.all([privatePromise, publicPromise]);
    };
};

export const rotateOrganizationKeys = ({
    password: newPassword,
}: {
    password: string;
}): ThunkAction<
    Promise<ReturnType<typeof updateOrganizationKeysV2> | ReturnType<typeof updateOrganizationKeysLegacy>>,
    OrganizationKeyState,
    ProtonThunkArguments,
    UnknownAction
> => {
    return async (dispatch, getState, extra) => {
        const organizationKey = await dispatch(organizationKeyThunk());

        const keyPassword = extra.authentication.getPassword();
        const addresses = await dispatch(addressesThunk());

        const publicMembersToReEncrypt = await dispatch(getPublicMembersToReEncryptPayload());

        const { privateKey, privateKeyArmored, backupKeySalt, backupArmoredPrivateKey } =
            await generateOrganizationKeys({
                keyPassword,
                backupPassword: newPassword,
                keyGenConfig,
            });

        const publicKey = await CryptoProxy.importPublicKey({ armoredKey: privateKeyArmored });

        if (getHasMigratedAddressKeys(addresses)) {
            let members: Parameters<typeof updateOrganizationKeysV2>[0]['Members'] = [];
            if (publicMembersToReEncrypt.length >= 1) {
                if (!organizationKey?.privateKey) {
                    throw new Error(getPrivatizeError());
                }
                members = await getReEncryptedPublicMemberTokensPayloadV2({
                    publicMembers: publicMembersToReEncrypt,
                    oldOrganizationKey: organizationKey,
                    newOrganizationKey: { privateKey, publicKey },
                });
            }
            return updateOrganizationKeysV2({
                PrivateKey: privateKeyArmored,
                BackupPrivateKey: backupArmoredPrivateKey,
                BackupKeySalt: backupKeySalt,
                Members: members,
            });
        }

        let tokens: Parameters<typeof updateOrganizationKeysLegacy>[0]['Tokens'] = [];
        if (publicMembersToReEncrypt.length >= 1) {
            if (!organizationKey?.privateKey) {
                throw new Error(getPrivatizeError());
            }
            tokens = await getReEncryptedPublicMemberTokensPayloadLegacy({
                publicMembers: publicMembersToReEncrypt,
                oldOrganizationKey: organizationKey,
                newOrganizationKey: { privateKey, publicKey },
            });
        }
        return updateOrganizationKeysLegacy({
            PrivateKey: privateKeyArmored,
            BackupPrivateKey: backupArmoredPrivateKey,
            BackupKeySalt: backupKeySalt,
            Tokens: tokens,
        });
    };
};

export const createPasswordlessOrganizationKeys = ({
    publicMembersToReEncryptPayload,
    memberKeyPayloads,
}: OrganizationKeyRotationPayload): ThunkAction<
    Promise<ReturnType<typeof createPasswordlessOrganizationKeysConfig>>,
    OrganizationKeyState,
    ProtonThunkArguments,
    UnknownAction
> => {
    return async (dispatch) => {
        const userKeys = await dispatch(userKeysThunk());
        const organizationKey = await dispatch(organizationKeyThunk());
        if (!organizationKey) {
            throw new Error('Org key loading');
        }
        const userKey = userKeys[0]?.privateKey;
        if (!userKey) {
            throw new Error('Missing primary user key');
        }
        const [primaryAddress] = await dispatch(addressesThunk());
        if (!primaryAddress) {
            throw new Error('Missing primary address');
        }
        const [primaryAddressKey] = await dispatch(addressKeysThunk({ addressID: primaryAddress.ID }));
        if (!primaryAddressKey) {
            throw new Error('Missing primary address key');
        }
        const { encryptedToken, signature, privateKey, privateKeyArmored } = await generatePasswordlessOrganizationKey({
            userKey,
            keyGenConfig,
        });
        const { publicAdminActivations, privateAdminInvitations } = await getReEncryptedAdminTokens({
            armoredMessage: encryptedToken,
            decryptionKeys: [userKey],
            address: { ID: primaryAddress.ID, privateKey: primaryAddressKey.privateKey },
            memberKeyPayloads,
        });
        const memberTokens = await getReEncryptedMemberTokens({
            publicMembersToReEncryptPayload,
            oldOrganizationKey: organizationKey,
            newOrganizationKey: { privateKey, privateKeyArmored },
        });
        return createPasswordlessOrganizationKeysConfig({
            Token: encryptedToken,
            Signature: signature,
            PrivateKey: privateKeyArmored,
            Members: memberTokens,
            AdminActivations: publicAdminActivations,
            AdminInvitations: privateAdminInvitations,
        });
    };
};

export const rotatePasswordlessOrganizationKeys = ({
    publicMembersToReEncryptPayload,
    memberKeyPayloads,
}: OrganizationKeyRotationPayload): ThunkAction<
    Promise<ReturnType<typeof updatePasswordlessOrganizationKeysConfig>>,
    OrganizationKeyState,
    ProtonThunkArguments,
    UnknownAction
> => {
    return async (dispatch) => {
        const userKeys = await dispatch(userKeysThunk());
        const organizationKey = await dispatch(organizationKeyThunk());
        if (!getIsPasswordless(organizationKey?.Key)) {
            throw new Error('Only used on passwordless organizations');
        }
        const userKey = userKeys[0]?.privateKey;
        if (!userKey) {
            throw new Error('Missing primary user key');
        }
        const [primaryAddress] = await dispatch(addressesThunk());
        if (!primaryAddress) {
            throw new Error('Missing primary address');
        }
        const [primaryAddressKey] = await dispatch(addressKeysThunk({ addressID: primaryAddress.ID }));
        if (!primaryAddressKey) {
            throw new Error('Missing primary address key');
        }
        const { signature, privateKey, privateKeyArmored, encryptedToken } = await generatePasswordlessOrganizationKey({
            userKey,
            keyGenConfig,
        });
        const { publicAdminActivations, privateAdminInvitations } = await getReEncryptedAdminTokens({
            armoredMessage: encryptedToken,
            decryptionKeys: [userKey],
            address: { ID: primaryAddress.ID, privateKey: primaryAddressKey.privateKey },
            memberKeyPayloads,
        });
        const memberTokens = await getReEncryptedMemberTokens({
            publicMembersToReEncryptPayload,
            oldOrganizationKey: organizationKey,
            newOrganizationKey: { privateKey, privateKeyArmored },
        });
        return updatePasswordlessOrganizationKeysConfig({
            PrivateKey: privateKeyArmored,
            Signature: signature,
            Token: encryptedToken,
            Members: memberTokens,
            AdminActivations: publicAdminActivations,
            AdminInvitations: privateAdminInvitations,
        });
    };
};

export type AcceptOrganizationKeyInvitePayload =
    | {
          state: 'verified';
          result: {
              keyPacket: string;
              signature: string;
          };
      }
    | {
          state: 'unverified' | 'public-keys';
          result: null;
      };
export const prepareAcceptOrganizationKeyInvite = ({
    adminEmail,
    verifyOutboundPublicKeys,
    api,
}: {
    adminEmail: string;
    verifyOutboundPublicKeys: VerifyOutboundPublicKeys;
    api: Api;
}): ThunkAction<
    Promise<AcceptOrganizationKeyInvitePayload>,
    OrganizationKeyState,
    ProtonThunkArguments,
    UnknownAction
> => {
    return async (dispatch) => {
        const userKeys = await dispatch(userKeysThunk());
        const organizationKey = await dispatch(organizationKeyThunk());
        const addresses = await dispatch(addressesThunk());

        if (!getIsPasswordless(organizationKey?.Key)) {
            throw new Error('Can only be used on passwordless orgs');
        }
        const primaryUserKey = userKeys[0];
        if (!primaryUserKey) {
            throw new Error('Missing primary user key');
        }
        const targetAddress = addresses?.find((address) => address.ID === organizationKey.Key.EncryptionAddressID);
        if (!targetAddress) {
            throw new Error('Missing encryption address');
        }

        const addressKeys = await dispatch(addressKeysThunk({ addressID: targetAddress.ID }));
        if (!addressKeys.length) {
            throw new Error('Missing address keys');
        }

        const adminEmailPublicKeys = (
            await getVerifiedPublicKeys({
                api,
                email: adminEmail,
                verifyOutboundPublicKeys,
            })
        ).map(({ publicKey }) => publicKey);
        if (!adminEmailPublicKeys.length) {
            return {
                state: 'public-keys',
                result: null,
            };
        }

        const splitAddressKeys = splitKeys(addressKeys);
        try {
            const result = await acceptInvitation({
                Token: organizationKey.Key.Token,
                Signature: organizationKey.Key.Signature,
                decryptionKeys: splitAddressKeys.privateKeys,
                verificationKeys: adminEmailPublicKeys,
                encryptionKey: primaryUserKey.privateKey,
            });
            return {
                state: 'verified',
                result,
            };
        } catch (e: any) {
            const error = getSentryError(e);
            if (error) {
                captureMessage('Passwordless: Error accepting invite', { level: 'error', extra: { error } });
            }
            return {
                state: 'unverified',
                result: null,
            };
        }
    };
};

export const acceptOrganizationKeyInvite = ({
    api,
    payload,
}: {
    api: Api;
    payload: AcceptOrganizationKeyInvitePayload;
}): ThunkAction<Promise<void>, OrganizationKeyState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch) => {
        if (payload.state === 'verified') {
            await api(
                activatePasswordlessKey({
                    TokenKeyPacket: payload.result.keyPacket,
                    Signature: payload.result.signature,
                })
            );
            // Warning: Force a refetch of the org key because it's not present in the event manager.
            await dispatch(organizationKeyThunk({ cache: CacheType.None }));
        }
    };
};

export const migrateOrganizationKeyPasswordless = (): ThunkAction<
    Promise<void>,
    OrganizationKeyState,
    ProtonThunkArguments,
    UnknownAction
> => {
    return async (dispatch, _, { api, eventManager }) => {
        const userKeys = await dispatch(userKeysThunk());
        const organizationKey = await dispatch(organizationKeyThunk());
        if (getIsPasswordless(organizationKey?.Key)) {
            throw new Error('Only used on non-passwordless organizations');
        }
        if (!organizationKey?.privateKey) {
            throw new Error('Organization key must be decryptable to migrate');
        }
        const userKey = userKeys[0]?.privateKey;
        if (!userKey) {
            throw new Error('Missing primary user key');
        }
        const [primaryAddress] = await dispatch(addressesThunk());
        if (!primaryAddress) {
            throw new Error('Missing primary address');
        }
        const [primaryAddressKey] = await dispatch(addressKeysThunk({ addressID: primaryAddress.ID }));
        if (!primaryAddressKey) {
            throw new Error('Missing primary address key');
        }
        const { token, encryptedToken, signature } = await generateOrganizationKeyToken(userKey);
        const PrivateKey = await CryptoProxy.exportPrivateKey({
            privateKey: organizationKey.privateKey,
            passphrase: token,
        });

        const members = await dispatch(membersThunk());
        const otherAdminMembersToMigrate = members.filter((member) => {
            return (
                member.Role === MEMBER_ROLE.ORGANIZATION_ADMIN &&
                !member.Self &&
                (member.AccessToOrgKey === MEMBER_ORG_KEY_STATE.Active || member.Private === MEMBER_PRIVATE.READABLE)
            );
        });

        const silentApi = getSilentApi(api);

        try {
            const memberKeyPayloads = await dispatch(
                getMemberKeyPayloads({
                    api: silentApi,
                    mode: {
                        // Encrypting the generated token to the organization public key (instead of the invited user's primary address key)
                        type: 'org-key',
                        publicKey: organizationKey.publicKey,
                    },
                    members: otherAdminMembersToMigrate,
                    ignorePasswordlessValidation: true,
                })
            );

            const { publicAdminActivations, privateAdminInvitations } = await getReEncryptedAdminTokens({
                armoredMessage: encryptedToken,
                decryptionKeys: [userKey],
                // Signing the token signature with the organization private key
                address: { ID: primaryAddress.ID, privateKey: organizationKey.privateKey },
                memberKeyPayloads,
            });

            await silentApi(
                migratePasswordlessOrganizationKey({
                    PrivateKey,
                    Token: encryptedToken,
                    Signature: signature,
                    AdminActivations: publicAdminActivations,
                    AdminInvitations: privateAdminInvitations.map((invitation) => ({
                        MemberID: invitation.MemberID,
                        TokenKeyPacket: invitation.TokenKeyPacket,
                        Signature: invitation.Signature,
                    })),
                })
            );

            await eventManager.call();
        } catch (e: any) {
            const error = getSentryError(e);
            if (error) {
                captureMessage('Passwordless: Error migrating organization', { level: 'error', extra: { error } });
            }
        }
    };
};

export const migrateOrganizationKeyPasswordlessPrivateAdmin = (): ThunkAction<
    Promise<void>,
    OrganizationKeyState,
    ProtonThunkArguments,
    UnknownAction
> => {
    return async (dispatch, _, { api, eventManager }) => {
        const userKeys = await dispatch(userKeysThunk());
        const organizationKey = await dispatch(organizationKeyThunk());
        if (!getIsPasswordless(organizationKey?.Key) || !organizationKey.privateKey) {
            throw new Error('Only used on passwordless organizations');
        }
        const primaryUserKey = userKeys[0];
        if (!primaryUserKey) {
            throw new Error('Missing primary user key');
        }
        const [primaryAddress] = await dispatch(addressesThunk());
        if (!primaryAddress) {
            throw new Error('Missing primary address');
        }
        const [primaryAddressKey] = await dispatch(addressKeysThunk({ addressID: primaryAddress.ID }));
        if (!primaryAddressKey) {
            throw new Error('Missing primary address key');
        }

        const silentApi = getSilentApi(api);
        try {
            const result = await acceptInvitation({
                Token: organizationKey.Key.Token,
                Signature: organizationKey.Key.Signature,
                decryptionKeys: [organizationKey.privateKey],
                verificationKeys: [organizationKey.privateKey],
                encryptionKey: primaryUserKey.privateKey,
            });
            await dispatch(
                acceptOrganizationKeyInvite({
                    api: silentApi,
                    payload: {
                        state: 'verified',
                        result,
                    },
                })
            );
            await eventManager.call();
        } catch (e: any) {
            const error = getSentryError(e);
            if (error) {
                captureMessage('Passwordless: Error accepting migration invite', { level: 'error', extra: { error } });
            }
        }
    };
};

export const changeOrganizationSignature = ({
    address,
}: {
    address: Address;
}): ThunkAction<Promise<void>, OrganizationKeyState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, getState, extra) => {
        const organizationKey = await dispatch(organizationKeyThunk());
        const [primaryAddressKey] = await dispatch(addressKeysThunk({ addressID: address.ID }));
        if (!primaryAddressKey?.privateKey) {
            throw new Error('Missing primary address key');
        }
        if (!organizationKey?.privateKey) {
            throw new Error('Missing organization key');
        }

        const signature = await generateOrganizationKeySignature({
            signingKeys: primaryAddressKey.privateKey,
            organizationKey: organizationKey.privateKey,
        });
        const silentApi = getSilentApi(extra.api);
        await silentApi(
            uploadOrganizationKeySignature({
                AddressID: address.ID,
                Signature: signature,
            })
        );
        await extra.eventManager.call();
    };
};
