import type { ThunkAction, ThunkDispatch, UnknownAction } from '@reduxjs/toolkit';
import { c } from 'ttag';

import type { GroupsState } from '@proton/account/groups';
import { groupThunk, updateGroup } from '@proton/account/groups';
import { CryptoProxy, type PrivateKeyReference, type PublicKeyReference } from '@proton/crypto';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { CacheType } from '@proton/redux-utilities';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { activatePasswordlessKey, updateRolePasswordless } from '@proton/shared/lib/api/members';
import type { GroupAddressKeyToken } from '@proton/shared/lib/api/organization';
import {
    createPasswordlessOrganizationKeys as createPasswordlessOrganizationKeysConfig,
    migratePasswordlessOrganizationKey,
    updateOrganizationKeysLegacy,
    updateOrganizationKeysV2,
    updatePasswordlessOrganizationKeys as updatePasswordlessOrganizationKeysConfig,
    uploadOrganizationKeySignature,
} from '@proton/shared/lib/api/organization';
import { KEYGEN_CONFIGS, KEYGEN_TYPES, MEMBER_PRIVATE, MEMBER_ROLE } from '@proton/shared/lib/constants';
import { getIsAddressConfirmed, getIsAddressEnabled } from '@proton/shared/lib/helpers/address';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';
import type {
    Address,
    Api,
    CachedOrganizationKey,
    EnhancedMember,
    Group,
    KTUserContext,
    Member,
} from '@proton/shared/lib/interfaces';
import { MEMBER_ORG_KEY_STATE } from '@proton/shared/lib/interfaces';
import {
    type OrganizationKeyTokenData,
    type OrganizationKeyTokenDataSigner,
    acceptInvitation,
    generateOrganizationKeySignature,
    generateOrganizationKeyToken,
    generateOrganizationKeys,
    generatePasswordlessOrganizationKey,
    generatePrivateMemberInvitation,
    generatePublicMemberActivation,
    getDecryptedOrganizationKeyTokenData,
    getDecryptedUserKeys,
    getHasMigratedAddressKeys,
    getIsPasswordless,
    getOrganizationKeyToken,
    getOrganizationKeyTokenDataSigner,
    getPrimaryKey,
    getReEncryptedPublicMemberTokensPayloadLegacy,
    getReEncryptedPublicMemberTokensPayloadV2,
    getSentryError,
    getVerifiedPublicKeys,
    reencryptAddressKeyTokenUsingOrgKey,
    splitKeys,
} from '@proton/shared/lib/keys';
import { getIsMemberSetup } from '@proton/shared/lib/keys/memberHelper';
import type { OrganizationKeyActivation, OrganizationKeyInvitation } from '@proton/shared/lib/keys/organizationKeyDto';
import isTruthy from '@proton/utils/isTruthy';

import { addressKeysThunk } from '../addressKeys';
import { addressesThunk } from '../addresses';
import type { KtState } from '../kt';
import { getKTUserContext } from '../kt/actions';
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

export const getGroupsError = () => {
    return c('passwordless').t`You must delete all groups before generating a new organization key`;
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
    type: 'public';
    member: Member;
    email: string;
    address: Address | undefined;
    privateKey: PrivateKeyReference;
}

export interface PrivateMemberKeyPayload {
    type: 'private';
    member: Member;
    email: string;
    address: Address;
    publicKey: PublicKeyReference;
}

export interface PromoteGlobalSSOPayload {
    type: 'promote-global-sso';
    address: Address | undefined;
    email: string;
    member: Member;
}

export type MemberKeyPayload = PrivateMemberKeyPayload | PublicMemberKeyPayload;

export type PublicMembersReEncryptPayload = {
    member: Member;
    memberAddresses: Address[];
}[];

export interface OrganizationKeyRotationPayload {
    publicMembersToReEncryptPayload: PublicMembersReEncryptPayload;
    memberKeyPayloads: MemberKeyPayload[];
    groups: Group[];
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
              ktUserContext: KTUserContext;
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
            type: 'public',
            member,
            address,
            email: address?.Email || member.Name,
            privateKey,
        };
    }

    if (mode.type === 'org-key') {
        return {
            type: 'private',
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
            email,
            ktUserContext: mode.ktUserContext,
        })
    )[0]?.publicKey;
    if (!memberPublicKey) {
        throw new Error(getPrivateAdminError());
    }
    return {
        type: 'private',
        member,
        address,
        email,
        publicKey: memberPublicKey,
    };
};

const getReEncryptedAdminTokens = async ({
    organizationKeyTokenData,
    organizationKeyTokenDataSigner,
    memberKeyPayloads,
}: {
    organizationKeyTokenData: OrganizationKeyTokenData;
    organizationKeyTokenDataSigner: OrganizationKeyTokenDataSigner;
    memberKeyPayloads: MemberKeyPayload[];
}): Promise<{
    privateAdminInvitations: (OrganizationKeyInvitation & { MemberID: string })[];
    publicAdminActivations: (OrganizationKeyActivation & { MemberID: string })[];
}> => {
    const { privateAdminPromises, publicAdminPromises } = memberKeyPayloads.reduce<{
        privateAdminPromises: Promise<OrganizationKeyInvitation & { MemberID: string }>[];
        publicAdminPromises: Promise<OrganizationKeyActivation & { MemberID: string }>[];
    }>(
        (acc, memberPayload) => {
            if (memberPayload.type === 'private') {
                const { member, publicKey, address } = memberPayload;
                acc.privateAdminPromises.push(
                    generatePrivateMemberInvitation({
                        publicKey,
                        addressID: address.ID,
                        signer: organizationKeyTokenDataSigner,
                        data: organizationKeyTokenData,
                    }).then((result) => ({ ...result, MemberID: member.ID }))
                );
            } else {
                const { member, privateKey } = memberPayload;
                acc.publicAdminPromises.push(
                    generatePublicMemberActivation({
                        privateKey,
                        data: organizationKeyTokenData,
                    }).then((result) => ({ ...result, MemberID: member.ID }))
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
    payload: PromoteGlobalSSOPayload | MemberKeyPayload;
    prompt: boolean;
};
type ConfirmDemotionMemberAction = {
    type: 'confirm-demote';
    payload: PromoteGlobalSSOPayload | null;
};
export type MemberPromptAction = ConfirmPromotionMemberAction | ConfirmDemotionMemberAction;

const getPromoteGlobalSSOPayload = ({
    member,
    memberAddresses,
}: {
    member: Member;
    memberAddresses: Address[];
}): PromoteGlobalSSOPayload => {
    const address: Address | undefined = memberAddresses.filter(
        (address) => getIsAddressEnabled(address) && address.HasKeys
    )[0];
    return {
        type: 'promote-global-sso',
        address,
        member,
        email: address?.Email || '',
    };
};

export const getMemberEditPayload = ({
    member,
    memberDiff,
    api,
}: {
    member: EnhancedMember;
    memberDiff: Partial<{
        role: MEMBER_ROLE;
    }>;
    api: Api;
}): ThunkAction<
    Promise<MemberPromptAction | null>,
    KtState & OrganizationKeyState,
    ProtonThunkArguments,
    UnknownAction
> => {
    return async (dispatch) => {
        const organizationKey = await dispatch(organizationKeyThunk());
        const passwordlessMode = getIsPasswordless(organizationKey?.Key);

        if (memberDiff.role === MEMBER_ROLE.ORGANIZATION_MEMBER) {
            const payload =
                member.SSO && !getIsMemberSetup(member)
                    ? getPromoteGlobalSSOPayload({
                          member,
                          memberAddresses: await dispatch(getMemberAddresses({ member, retry: true })),
                      })
                    : null;
            return {
                type: 'confirm-demote',
                payload,
            };
        }

        if (memberDiff.role === MEMBER_ROLE.ORGANIZATION_ADMIN && passwordlessMode) {
            const memberAddresses = await dispatch(getMemberAddresses({ member, retry: true }));

            if (member.SSO && !getIsMemberSetup(member)) {
                return {
                    type: 'confirm-promote',
                    payload: getPromoteGlobalSSOPayload({ member, memberAddresses }),
                    prompt: true,
                };
            }

            const payload = await getMemberKeyPayload({
                organizationKey,
                mode: {
                    type: 'email',
                    ktUserContext: await dispatch(getKTUserContext()),
                },
                api,
                member,
                memberAddresses,
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

export const getGroupsToReEncryptPayload = (): ThunkAction<
    Promise<Group[]>,
    RotateOrganizationKeysState,
    ProtonThunkArguments,
    UnknownAction
> => {
    return async (dispatch) => {
        const organizationKey = await dispatch(organizationKeyThunk());
        const groups = await dispatch(groupThunk());
        if (groups.length >= 1) {
            // we need the org key to be able to re-encrypt the group keys if we have any group
            if (!organizationKey?.privateKey) {
                throw new Error(getGroupsError());
            }
        }
        return groups;
    };
};

export const getKeyRotationPayload = ({
    api,
    ignorePasswordlessValidation,
}: {
    api: Api;
    ignorePasswordlessValidation?: boolean;
}): ThunkAction<
    Promise<OrganizationKeyRotationPayload>,
    RotateOrganizationKeysState,
    ProtonThunkArguments,
    UnknownAction
> => {
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

        const [memberKeyPayloads, publicMembersToReEncryptPayload, groups] = await Promise.all([
            dispatch(
                getMemberKeyPayloads({
                    api,
                    mode: {
                        type: 'email',
                        ktUserContext: await dispatch(getKTUserContext()),
                    },
                    members: otherAdminMembers,
                    ignorePasswordlessValidation,
                })
            ),
            dispatch(getPublicMembersToReEncryptPayload()),
            dispatch(getGroupsToReEncryptPayload()),
        ]);

        return {
            memberKeyPayloads,
            publicMembersToReEncryptPayload,
            groups,
        };
    };
};
export const getAdminRolePayloads = ({
    memberKeyPayloads,
}: {
    memberKeyPayloads: MemberKeyPayload[];
}): ThunkAction<
    ReturnType<typeof getReEncryptedAdminTokens>,
    OrganizationKeyState,
    ProtonThunkArguments,
    UnknownAction
> => {
    return async (dispatch) => {
        const [userKeys, organizationKey, addresses] = await Promise.all([
            dispatch(userKeysThunk()),
            dispatch(organizationKeyThunk()),
            dispatch(addressesThunk()),
        ]);
        if (!getIsPasswordless(organizationKey?.Key)) {
            throw new Error('Only used on passwordless organizations');
        }
        if (!organizationKey?.privateKey) {
            throw new Error('Organization key must be activated to set admin role');
        }
        const userKey = userKeys[0]?.privateKey;
        if (!userKey) {
            throw new Error('Missing primary user key');
        }
        const [primaryAddress] = addresses;
        if (!primaryAddress) {
            throw new Error('Missing primary address');
        }
        const [primaryAddressKey] = await dispatch(addressKeysThunk({ addressID: primaryAddress.ID }));
        if (!primaryAddressKey) {
            throw new Error('Missing primary address key');
        }
        const organizationKeyTokenData = await getDecryptedOrganizationKeyTokenData({
            armoredMessage: organizationKey.Key.Token,
            decryptionKeys: userKeys.map(({ privateKey }) => privateKey),
        });
        const organizationKeyTokenDataSigner = getOrganizationKeyTokenDataSigner({
            address: primaryAddress,
            privateKey: primaryAddressKey.privateKey,
        });
        return getReEncryptedAdminTokens({
            organizationKeyTokenData,
            organizationKeyTokenDataSigner,
            memberKeyPayloads,
        });
    };
};

export const setAdminRoles = ({
    memberKeyPayloads,
    api,
}: { memberKeyPayloads: MemberKeyPayload[] } & {
    api: Api;
}): ThunkAction<Promise<void>, OrganizationKeyState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch) => {
        const { publicAdminActivations, privateAdminInvitations } = await dispatch(
            getAdminRolePayloads({ memberKeyPayloads })
        );

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

const getReEncryptedGroupAddressKeyTokens = async ({
    groups,
    oldOrganizationKey,
    newOrganizationKey,
}: {
    groups: Group[];
    oldOrganizationKey: CachedOrganizationKey;
    newOrganizationKey: PrivateKeyReference;
}): Promise<GroupAddressKeyToken[]> => {
    return Promise.all(
        groups.map(async ({ Address: address }) => {
            const primaryAddressKey = address.Keys[0];
            if (!primaryAddressKey) {
                return null;
            }
            const { encryptedToken: Token, signature: OrgSignature } = await reencryptAddressKeyTokenUsingOrgKey(
                primaryAddressKey,
                oldOrganizationKey,
                newOrganizationKey
            );
            return {
                ID: primaryAddressKey.ID,
                Token,
                OrgSignature,
            };
        })
    ).then((groupAddressKeyTokens) => groupAddressKeyTokens.filter(isTruthy));
};

const updateGroups = ({
    groups,
    GroupAddressKeyTokens,
    dispatch,
}: {
    groups: Group[];
    GroupAddressKeyTokens: GroupAddressKeyToken[];
    dispatch: ThunkDispatch<RotateOrganizationKeysState, ProtonThunkArguments, UnknownAction>;
}) => {
    for (const group of groups) {
        const address = group.Address;
        const primaryAddressKey = address.Keys[0];
        if (!primaryAddressKey) {
            continue;
        }
        const groupAddressKeyToken = GroupAddressKeyTokens.find(({ ID }) => ID === primaryAddressKey.ID);
        if (!groupAddressKeyToken) {
            continue;
        }
        dispatch(
            updateGroup({
                ...group,
                Address: {
                    ...address,
                    Keys: address.Keys.map((key) => {
                        if (key.ID === primaryAddressKey.ID) {
                            return {
                                ...key,
                                Token: groupAddressKeyToken.Token,
                                Signature: groupAddressKeyToken.OrgSignature,
                            };
                        }
                        return key;
                    }),
                },
            })
        );
    }
};

export interface RotateOrganizationKeysState extends KtState, OrganizationKeyState, GroupsState {}

export const rotateOrganizationKeys = ({
    password: newPassword,
}: {
    password: string;
}): ThunkAction<
    Promise<ReturnType<typeof updateOrganizationKeysV2> | ReturnType<typeof updateOrganizationKeysLegacy>>,
    RotateOrganizationKeysState,
    ProtonThunkArguments,
    UnknownAction
> => {
    return async (dispatch, getState, extra) => {
        const organizationKey = await dispatch(organizationKeyThunk());

        const keyPassword = extra.authentication.getPassword();
        const addresses = await dispatch(addressesThunk());

        const publicMembersToReEncrypt = await dispatch(getPublicMembersToReEncryptPayload());
        const groups = await dispatch(getGroupsToReEncryptPayload());

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

            let GroupAddressKeyTokens: GroupAddressKeyToken[] = [];
            if (groups.length >= 1) {
                if (!organizationKey?.privateKey) {
                    throw new Error(getGroupsError());
                }
                GroupAddressKeyTokens = await getReEncryptedGroupAddressKeyTokens({
                    groups,
                    oldOrganizationKey: organizationKey,
                    newOrganizationKey: privateKey,
                });
            }

            const result = updateOrganizationKeysV2({
                PrivateKey: privateKeyArmored,
                BackupPrivateKey: backupArmoredPrivateKey,
                BackupKeySalt: backupKeySalt,
                Members: members,
                GroupAddressKeyTokens,
            });

            updateGroups({
                groups,
                GroupAddressKeyTokens,
                dispatch,
            });

            return result;
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

        // This endpoint will only be called for orgs that are not migrated yet, which do not exist
        // Thus, if they exist, pass an empty group array, as we don't support them anymore
        // This will make the backend crash and not update the keys
        // Should this happen, the user can contact us and we can look into it
        const GroupAddressKeyTokens: GroupAddressKeyToken[] = [];

        return updateOrganizationKeysLegacy({
            PrivateKey: privateKeyArmored,
            BackupPrivateKey: backupArmoredPrivateKey,
            BackupKeySalt: backupKeySalt,
            Tokens: tokens,
            GroupAddressKeyTokens,
        });
    };
};

export const createPasswordlessOrganizationKeys = ({
    publicMembersToReEncryptPayload,
    memberKeyPayloads,
    groups,
}: OrganizationKeyRotationPayload): ThunkAction<
    Promise<ReturnType<typeof createPasswordlessOrganizationKeysConfig>>,
    RotateOrganizationKeysState,
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
        const organizationKeyTokenData = await getDecryptedOrganizationKeyTokenData({
            armoredMessage: encryptedToken,
            decryptionKeys: [userKey],
        });
        const organizationKeyTokenDataSigner = getOrganizationKeyTokenDataSigner({
            address: primaryAddress,
            privateKey: primaryAddressKey.privateKey,
        });
        const { publicAdminActivations, privateAdminInvitations } = await getReEncryptedAdminTokens({
            organizationKeyTokenData,
            organizationKeyTokenDataSigner,
            memberKeyPayloads,
        });
        const memberTokens = await getReEncryptedMemberTokens({
            publicMembersToReEncryptPayload,
            oldOrganizationKey: organizationKey,
            newOrganizationKey: { privateKey, privateKeyArmored },
        });

        const GroupAddressKeyTokens = await getReEncryptedGroupAddressKeyTokens({
            groups,
            oldOrganizationKey: organizationKey,
            newOrganizationKey: privateKey,
        });

        const result = createPasswordlessOrganizationKeysConfig({
            Token: encryptedToken,
            Signature: signature,
            PrivateKey: privateKeyArmored,
            Members: memberTokens,
            AdminActivations: publicAdminActivations,
            AdminInvitations: privateAdminInvitations,
            GroupAddressKeyTokens,
        });

        updateGroups({
            groups,
            GroupAddressKeyTokens,
            dispatch,
        });

        return result;
    };
};

export const rotatePasswordlessOrganizationKeys = ({
    publicMembersToReEncryptPayload,
    memberKeyPayloads,
    groups,
}: OrganizationKeyRotationPayload): ThunkAction<
    Promise<ReturnType<typeof updatePasswordlessOrganizationKeysConfig>>,
    RotateOrganizationKeysState,
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
        const organizationKeyTokenData = await getDecryptedOrganizationKeyTokenData({
            armoredMessage: encryptedToken,
            decryptionKeys: [userKey],
        });
        const organizationKeyTokenDataSigner = getOrganizationKeyTokenDataSigner({
            address: primaryAddress,
            privateKey: primaryAddressKey.privateKey,
        });
        const { publicAdminActivations, privateAdminInvitations } = await getReEncryptedAdminTokens({
            organizationKeyTokenData,
            organizationKeyTokenDataSigner,
            memberKeyPayloads,
        });
        const memberTokens = await getReEncryptedMemberTokens({
            publicMembersToReEncryptPayload,
            oldOrganizationKey: organizationKey,
            newOrganizationKey: { privateKey, privateKeyArmored },
        });

        const GroupAddressKeyTokens = await getReEncryptedGroupAddressKeyTokens({
            groups,
            oldOrganizationKey: organizationKey,
            newOrganizationKey: privateKey,
        });

        const result = updatePasswordlessOrganizationKeysConfig({
            PrivateKey: privateKeyArmored,
            Signature: signature,
            Token: encryptedToken,
            Members: memberTokens,
            AdminActivations: publicAdminActivations,
            AdminInvitations: privateAdminInvitations,
            GroupAddressKeyTokens,
        });

        updateGroups({
            groups,
            GroupAddressKeyTokens,
            dispatch,
        });

        return result;
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
    api,
}: {
    adminEmail: string;
    api: Api;
}): ThunkAction<
    Promise<AcceptOrganizationKeyInvitePayload>,
    KtState & OrganizationKeyState,
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
                ktUserContext: await dispatch(getKTUserContext()),
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
    return async (dispatch, _, { api }) => {
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

            const organizationKeyTokenData = await getDecryptedOrganizationKeyTokenData({
                armoredMessage: encryptedToken,
                decryptionKeys: [userKey],
            });
            const organizationKeyTokenDataSigner = getOrganizationKeyTokenDataSigner({
                address: primaryAddress,
                // Signing the token signature with the organization private key in the migration scenario
                privateKey: organizationKey.privateKey,
            });
            const { publicAdminActivations, privateAdminInvitations } = await getReEncryptedAdminTokens({
                organizationKeyTokenData,
                organizationKeyTokenDataSigner,
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

            await Promise.all([
                dispatch(organizationKeyThunk({ cache: CacheType.None })),
                dispatch(membersThunk({ cache: CacheType.None })),
            ]);
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
    return async (dispatch, _, { api }) => {
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
        } catch (e: any) {
            const error = getSentryError(e);
            if (error) {
                captureMessage('Passwordless: Error accepting migration invite', { level: 'error', extra: { error } });
            }
        }
    };
};

export const getIsEligibleOrganizationIdentityAddress = (address: Address) => {
    return getIsAddressEnabled(address) && getIsAddressConfirmed(address);
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
        await dispatch(organizationKeyThunk({ cache: CacheType.None }));
    };
};
