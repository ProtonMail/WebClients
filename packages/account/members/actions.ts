import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit';
import { c } from 'ttag';

import { createKTVerifier } from '@proton/key-transparency/helpers';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { CacheType } from '@proton/redux-utilities';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import {
    addSSOSamlMember,
    checkMemberAddressAvailability,
    createMemberAddress,
    createMember as createMemberConfig,
    deleteMember as deleteMemberConfig,
    deleteUnprivatizationRequest,
    disableMember as disableMemberConfig,
    editMemberInvitation,
    enableMember as enableMemberConfig,
    inviteMember,
    privatizeMember as privatizeMemberConfig,
    removeSSOSamlMember,
    requestUnprivatization as requestUnprivatizationConfig,
    unprivatizeMemberKeysRoute,
    updateAI,
    updateLumo,
    updateName,
    updateQuota,
    updateRole as updateRoleConfig,
    updateVPN,
} from '@proton/shared/lib/api/members';
import {
    DEFAULT_KEYGEN_TYPE,
    HTTP_STATUS_CODE,
    KEYGEN_CONFIGS,
    MEMBER_PRIVATE,
    MEMBER_ROLE,
    VPN_CONNECTIONS,
} from '@proton/shared/lib/constants';
import { validateEmailAddress } from '@proton/shared/lib/helpers/email';
import type {
    Address,
    Api,
    Domain,
    KTUserContext,
    Member,
    MemberReadyForAutomaticUnprivatization,
    Organization,
} from '@proton/shared/lib/interfaces';
import { CreateMemberMode } from '@proton/shared/lib/interfaces';
import {
    getInvitationData,
    getIsMemberInAutomaticApproveState,
    getIsMemberInManualAcceptState,
    getIsPasswordless,
    getSignedInvitationData,
    getUnprivatizeMemberPayload,
    setupMemberKeys,
} from '@proton/shared/lib/keys';
import { getIsMemberSetup } from '@proton/shared/lib/keys/memberHelper';
import { getOrganizationKeyInfo } from '@proton/shared/lib/organization/helper';
import { srpVerify } from '@proton/shared/lib/srp';
import noop from '@proton/utils/noop';

import { addressesThunk } from '../addresses';
import type { KtState } from '../kt';
import { getKTActivation, getKTUserContext } from '../kt/actions';
import { type MemberState, memberThunk } from '../member';
import { getPendingUnprivatizationRequest, memberAcceptUnprivatization } from '../member/actions';
import { organizationThunk } from '../organization';
import type { OrganizationKeyState } from '../organizationKey';
import { organizationKeyThunk } from '../organizationKey';
import {
    type MemberKeyPayload,
    type PromoteGlobalSSOPayload,
    getMemberKeyPayload,
    getPrivateAdminError,
    setAdminRoles,
} from '../organizationKey/actions';
import { userThunk } from '../user';
import { userKeysThunk } from '../userKeys';
import InvalidAddressesError from './errors/InvalidAddressesError';
import UnavailableAddressesError from './errors/UnavailableAddressesError';
import { getMember } from './getMember';
import {
    MemberCreationValidationError,
    type MembersState,
    getMemberAddresses,
    membersThunk,
    upsertMember,
} from './index';
import validateAddUser from './validateAddUser';

export const unprivatizeMember = ({
    member,
    ktUserContext,
    options,
    api,
}: {
    member: MemberReadyForAutomaticUnprivatization;
    ktUserContext: KTUserContext;
    options?: Parameters<typeof getUnprivatizeMemberPayload>[0]['options'];
    api: Api;
}): ThunkAction<
    Promise<void>,
    KtState & MemberState & MembersState & OrganizationKeyState,
    ProtonThunkArguments,
    UnknownAction
> => {
    return async (dispatch) => {
        const [userKeys, organizationKey, memberAddresses] = await Promise.all([
            dispatch(userKeysThunk()),
            dispatch(organizationKeyThunk()), // Fetch org key again to ensure it's up-to-date.
            dispatch(getMemberAddresses({ member, retry: true })),
        ]);
        const payload = await getUnprivatizeMemberPayload({
            api,
            member,
            memberAddresses,
            organizationKey,
            userKeys,
            ktUserContext,
            options,
        });
        await api(unprivatizeMemberKeysRoute(member.ID, payload));
        if (member.Self) {
            await dispatch(userThunk({ cache: CacheType.None }));
        }
    };
};

export const deleteMembers = ({
    members,
}: {
    members: Member[];
}): ThunkAction<
    Promise<{
        success: Member[];
        failure: Member[];
    }>,
    OrganizationKeyState,
    ProtonThunkArguments,
    UnknownAction
> => {
    return async (dispatch, getState, extra) => {
        const success: Member[] = [];
        const failure: Member[] = [];
        for (const member of members) {
            const deleted = await extra
                .api(deleteMemberConfig(member.ID))
                .then(() => true)
                .catch(noop);
            if (deleted) {
                success.push(member);
            } else {
                failure.push(member);
            }
        }
        for (const member of success) {
            dispatch(upsertMember({ member, type: 'delete' }));
        }
        return { success, failure };
    };
};

export const requestUnprivatization = ({
    api,
    member,
    makeAdmin,
}: {
    api: Api;
    member: Member;
    makeAdmin?: boolean;
}): ThunkAction<Promise<void>, OrganizationKeyState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch) => {
        const organizationKey = await dispatch(organizationKeyThunk()); // Ensure latest key
        if (!organizationKey?.privateKey) {
            throw new MemberCreationValidationError(
                c('unprivatization').t`Organization key must be activated to request data access`
            );
        }
        const memberAddresses = await dispatch(getMemberAddresses({ member, retry: true }));
        const primaryEmailAddress = memberAddresses?.[0].Email;
        if (!primaryEmailAddress) {
            throw new MemberCreationValidationError(
                c('unprivatization').t`The user must have an address to request data access`
            );
        }
        // If the member don't have keys setup, it's only allowed to pass-through for SSO members.
        // This is because those members get into the global SSO password setup flow on next login.
        // For regular members, there's the join magic link flow, however that is not triggered
        // for those members signing in.
        if (!member.SSO && !getIsMemberSetup(member)) {
            throw new MemberCreationValidationError(c('unprivatization').t`Member activation incomplete`);
        }
        const invitationData = await getInvitationData({
            api,
            address: primaryEmailAddress,
            expectRevisionChange: false,
            admin: makeAdmin ? true : undefined,
        });
        const invitationSignature = await getSignedInvitationData(organizationKey.privateKey, invitationData);
        await api(
            requestUnprivatizationConfig(member.ID, {
                InvitationData: invitationData,
                InvitationSignature: invitationSignature,
            })
        );
    };
};

export const unprivatizeSelf = ({
    api,
    member: initialMember,
}: {
    api: Api;
    member: Member;
}): ThunkAction<
    Promise<void>,
    KtState & MemberState & MembersState & OrganizationKeyState,
    ProtonThunkArguments,
    UnknownAction
> => {
    return async (dispatch, _, extra) => {
        try {
            let member = initialMember;

            if (
                !member.Self ||
                member.Private !== MEMBER_PRIVATE.UNREADABLE ||
                member.Role !== MEMBER_ROLE.ORGANIZATION_ADMIN
            ) {
                throw new Error('Can only be used for private self admins');
            }

            // Stop the event manager to prevent the background unprivatization kicking in
            // This operation should just be run in this context alone
            extra.eventManager.stop();

            if (!member.Unprivatization) {
                await dispatch(requestUnprivatization({ member, api }));
                member = await dispatch(memberThunk({ cache: CacheType.None }));
            }

            if (getIsMemberInManualAcceptState(member)) {
                // Fetch the unprivatization data (self) and accept it
                const pendingData = await dispatch(getPendingUnprivatizationRequest({ member }));

                if (!pendingData) {
                    throw new Error('Unable to get pending unprivatization for self');
                }

                await dispatch(
                    memberAcceptUnprivatization({
                        api,
                        member,
                        parsedUnprivatizationData: pendingData.parsedUnprivatizationData,
                    })
                );

                // Fetch the member again to get the updated values and finalize the unprivatization
                member = await dispatch(memberThunk({ cache: CacheType.None }));
            }

            if (getIsMemberInAutomaticApproveState(member)) {
                const ktUserContext = await dispatch(getKTUserContext());
                await dispatch(unprivatizeMember({ member, api, ktUserContext }));
            } else {
                throw new Error('Unable to finalize self unprivatization');
            }
        } finally {
            extra.eventManager.start();
        }
    };
};

export const deleteRequestUnprivatization = ({
    api,
    member,
}: {
    api: Api;
    member: Member;
}): ThunkAction<Promise<void>, OrganizationKeyState, ProtonThunkArguments, UnknownAction> => {
    return async () => {
        if (member.Unprivatization === null) {
            return;
        }
        await api(deleteUnprivatizationRequest(member.ID));
    };
};

export const setRole = ({
    member,
    payload,
    api,
    role,
}: {
    member: Member;
    payload: PromoteGlobalSSOPayload | MemberKeyPayload | null;
    api: Api;
    role: MEMBER_ROLE;
}): ThunkAction<Promise<void>, OrganizationKeyState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch) => {
        if (role === MEMBER_ROLE.ORGANIZATION_MEMBER) {
            if (payload?.type === 'promote-global-sso') {
                await dispatch(deleteRequestUnprivatization({ member, api }));
                return;
            }
            await api(updateRoleConfig(member.ID, MEMBER_ROLE.ORGANIZATION_MEMBER));
            return;
        }

        const organizationKey = await dispatch(organizationKeyThunk());

        if (!getIsPasswordless(organizationKey?.Key)) {
            await api(updateRoleConfig(member.ID, MEMBER_ROLE.ORGANIZATION_ADMIN));
            return;
        }

        if (!payload) {
            throw new Error('Missing payload');
        }

        if (payload.type === 'promote-global-sso') {
            if (getIsMemberSetup(member) || !member.SSO) {
                throw new MemberCreationValidationError('Unexpected request');
            }
            // For VPN SSO users we request unprivatization with admin flag to convert them to global sso users
            await dispatch(requestUnprivatization({ member, api, makeAdmin: true }));
            return;
        }

        await dispatch(setAdminRoles({ memberKeyPayloads: [payload], api }));
    };
};

export const privatizeMember = ({
    api,
    member,
}: {
    api: Api;
    member: Member;
}): ThunkAction<Promise<void>, OrganizationKeyState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch) => {
        await api(privatizeMemberConfig(member.ID));
        if (member.Self) {
            await dispatch(userThunk({ cache: CacheType.None }));
        }
    };
};

interface CreateMemberPayload {
    name: string;
    addresses: { Local: string; Domain: string }[];
    invitationEmail: string;
    mode: CreateMemberMode;
    private: MEMBER_PRIVATE | null;
    storage: number;
    vpn?: boolean;
    password: string;
    role: MEMBER_ROLE | null;
    numAI: boolean;
    lumo: boolean;
}

// This resets the VPN connections of the admin to the default value, since this gets reset by the API when changing subscriptions etc
export const resetAdminVPN = async ({
    api,
    members,
    organization,
}: {
    api: Api;
    members: Member[];
    organization: Organization;
}) => {
    const self = members.find((member) => Boolean(member.Self));
    if (organization.MaxVPN > 0 && self && self.MaxVPN !== VPN_CONNECTIONS && self.MaxVPN === organization.MaxVPN) {
        await api(updateVPN(self.ID, VPN_CONNECTIONS));
    }
};

export const editMember = ({
    member,
    memberDiff,
    memberKeyPacketPayload,
    api,
}: {
    member: Member;
    memberDiff: Partial<CreateMemberPayload>;
    memberKeyPacketPayload: PromoteGlobalSSOPayload | MemberKeyPayload | null;
    api: Api;
}): ThunkAction<
    Promise<{ diff: true; member: Member } | { diff: false; member: null }>,
    KtState & MemberState & MembersState & OrganizationKeyState,
    ProtonThunkArguments,
    UnknownAction
> => {
    return async (dispatch) => {
        if (memberDiff.name !== undefined) {
            await api(updateName(member.ID, memberDiff.name));
        }
        if (memberDiff.storage !== undefined) {
            await api(updateQuota(member.ID, memberDiff.storage));
        }
        if (memberDiff.vpn !== undefined) {
            if (memberDiff.vpn) {
                const [members, organization] = await Promise.all([
                    dispatch(membersThunk()),
                    dispatch(organizationThunk()),
                ]);
                await resetAdminVPN({ api, members, organization }).catch(noop);
            }
            await api(updateVPN(member.ID, memberDiff.vpn ? VPN_CONNECTIONS : 0));
        }
        if (memberDiff.numAI !== undefined) {
            await api(updateAI(member.ID, memberDiff.numAI ? 1 : 0));
        }
        if (memberDiff.lumo !== undefined) {
            await api(updateLumo(member.ID, memberDiff.lumo ? 1 : 0));
        }
        if (memberDiff.role === MEMBER_ROLE.ORGANIZATION_ADMIN) {
            await dispatch(setRole({ member, payload: memberKeyPacketPayload, api, role: memberDiff.role }));
        }
        if (memberDiff.role === MEMBER_ROLE.ORGANIZATION_MEMBER) {
            await dispatch(setRole({ member, payload: memberKeyPacketPayload, api, role: memberDiff.role }));
        }
        if (memberDiff.private !== undefined) {
            if (memberDiff.private === MEMBER_PRIVATE.UNREADABLE) {
                if (member.Unprivatization) {
                    await dispatch(deleteRequestUnprivatization({ member, api }));
                } else {
                    await dispatch(privatizeMember({ member, api }));
                }
            }
            if (member.Private === MEMBER_PRIVATE.UNREADABLE && memberDiff.private === MEMBER_PRIVATE.READABLE) {
                if (member.Self) {
                    await dispatch(unprivatizeSelf({ member, api }));
                } else {
                    await dispatch(requestUnprivatization({ member, api }));
                }
            }
        }
        const diff = Object.values(memberDiff).some((value) => value !== undefined);
        if (diff) {
            const [updatedMember] = await Promise.all([
                getMember(api, member.ID),
                // Upserting the member also has an effect on the org values, so they need to be updated too.
                dispatch(organizationThunk({ cache: CacheType.None })),
            ]);
            dispatch(upsertMember({ member: updatedMember }));
            return {
                diff: true,
                member: updatedMember,
            };
        }
        return {
            diff: false,
            member: null,
        };
    };
};

const createAddressesForMember = async ({
    api,
    addresses,
    member,
}: {
    member: Member;
    api: Api;
    addresses: { Local: string; Domain: string }[];
}) => {
    const memberAddresses: Address[] = [];
    for (const { Local, Domain } of addresses) {
        const { Address } = await api<{ Address: Address }>(
            createMemberAddress(member.ID, {
                Local,
                Domain,
            })
        );
        memberAddresses.push(Address);
    }
    return memberAddresses;
};

export const createMember = ({
    member: originalModel,
    single,
    verifiedDomains,
    api,
    validationOptions,
}: {
    member: CreateMemberPayload;
    single: boolean;
    verifiedDomains: Domain[] /* Remove dependency, move to thunk */;
    validationOptions: {
        disableStorageValidation?: boolean;
        disableDomainValidation?: boolean;
        disableAddressValidation?: boolean;
    };
    api: Api;
}): ThunkAction<Promise<Member>, KtState & OrganizationKeyState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, _, extra) => {
        let [user, userKeys, ownerAddresses, organizationKey, organization, members] = await Promise.all([
            dispatch(userThunk()),
            dispatch(userKeysThunk()),
            dispatch(addressesThunk()),
            dispatch(organizationKeyThunk()),
            dispatch(organizationThunk()),
            dispatch(membersThunk()),
        ]);

        const model = { ...originalModel };
        // Force role to member in invitation creation since it can't be created as anything else
        if (model.mode === CreateMemberMode.Invitation) {
            model.role = MEMBER_ROLE.ORGANIZATION_MEMBER;
        }

        if (model.vpn) {
            await resetAdminVPN({ api, members, organization }).catch(noop);
        }

        const error = validateAddUser({
            privateUser: model.private === MEMBER_PRIVATE.UNREADABLE,
            organization,
            organizationKeyInfo: getOrganizationKeyInfo(organization, organizationKey, ownerAddresses),
            verifiedDomains,
            ...validationOptions,
        });
        if (error) {
            throw new MemberCreationValidationError(error);
        }

        const invalidAddresses: string[] = [];
        const invalidInvitationAddresses: string[] = [];
        const validAddresses: string[] = [];

        const addressParts = model.addresses.map((parts) => {
            const emailAddress = `${parts.Local}@${parts.Domain}`;
            const isValid = validateEmailAddress(emailAddress);
            if (!isValid) {
                invalidAddresses.push(emailAddress);
            } else {
                validAddresses.push(emailAddress);
            }
            return {
                address: emailAddress,
                ...parts,
            };
        });

        if (model.mode === CreateMemberMode.Invitation) {
            if (!validateEmailAddress(model.invitationEmail)) {
                invalidInvitationAddresses.push(model.invitationEmail);
            }
        }

        if (invalidAddresses.length || invalidInvitationAddresses.length) {
            /**
             * Throw if any of the addresses are not valid
             */
            throw new InvalidAddressesError(invalidAddresses, invalidInvitationAddresses, validAddresses);
        }

        if (model.mode === CreateMemberMode.Password) {
            if (!model.private) {
                if (!organizationKey?.privateKey) {
                    throw new MemberCreationValidationError(
                        c('Error').t`Organization key must be activated to create non-private users`
                    );
                }
            }

            if (model.private) {
                if (model.role === MEMBER_ROLE.ORGANIZATION_ADMIN) {
                    if (getIsPasswordless(organizationKey?.Key)) {
                        throw new MemberCreationValidationError(getPrivateAdminError());
                    }
                }
            }
        }

        if (model.mode === CreateMemberMode.Invitation) {
            if (!organizationKey?.privateKey) {
                throw new MemberCreationValidationError(
                    c('Error').t`Organization key must be activated to create invited users`
                );
            }
        }

        const unavailableAddresses: { message: string; address: string }[] = [];
        const availableAddresses: string[] = [];

        const checkAddressAvailability = async ({ Local, Domain }: { Local: string; Domain: string }) => {
            const address = `${Local}@${Domain}`;
            try {
                await api(
                    checkMemberAddressAvailability({
                        Local,
                        Domain,
                    })
                );
                availableAddresses.push(address);
            } catch (error: any) {
                const { status, message } = getApiError(error);
                if (status === HTTP_STATUS_CODE.CONFLICT) {
                    // Conflict error from address being not available
                    unavailableAddresses.push({ message, address });
                    return;
                }

                throw error;
            }
        };

        const [firstAddressParts, ...restAddressParts] = addressParts;

        /**
         * Will prompt password prompt only once
         */
        await checkAddressAvailability(firstAddressParts);

        /**
         * No more password prompts will be needed
         */
        await Promise.all(restAddressParts.map(checkAddressAvailability));

        if (unavailableAddresses.length) {
            /**
             * Throw if any of the addresses are not available
             */
            throw new UnavailableAddressesError(unavailableAddresses, availableAddresses);
        }

        const payload = {
            Name: model.name || firstAddressParts.Local,
            MaxSpace: +model.storage,
            MaxVPN: model.vpn ? VPN_CONNECTIONS : 0,
            MaxAI: model.numAI ? 1 : 0,
            MaxLumo: model.lumo ? 1 : 0,
        };

        if (model.mode === CreateMemberMode.Invitation) {
            organizationKey = await dispatch(organizationKeyThunk()); // Ensure latest key
            if (!organizationKey?.privateKey) {
                throw new MemberCreationValidationError(
                    c('Error').t`Organization key must be activated to create invited users`
                );
            }
            const invitationData = await getInvitationData({
                api,
                address: `${firstAddressParts.Local}@${firstAddressParts.Domain}`,
                expectRevisionChange: true,
            });
            const invitationSignature = await getSignedInvitationData(organizationKey.privateKey, invitationData);
            const Member = await api(
                createMemberConfig({
                    ...payload,
                    Invitation: {
                        Email: model.invitationEmail,
                        Data: invitationData,
                        Signature: invitationSignature,
                        PrivateIntent: model.private === MEMBER_PRIVATE.UNREADABLE,
                    },
                })
            ).then(({ Member }) => Member);

            if (model.private) {
                await createAddressesForMember({
                    api,
                    member: Member,
                    addresses: model.addresses,
                });
            }

            const [updatedMember] = await Promise.all([
                getMember(api, Member.ID),
                // Upserting the member also has an effect on the org values, so they need to be updated too.
                single ? dispatch(organizationThunk({ cache: CacheType.None })) : undefined,
            ]);
            dispatch(upsertMember({ member: updatedMember }));
            return updatedMember;
        }

        const Member = await srpVerify<{ Member: Member }>({
            api,
            credentials: { password: model.password },
            config: createMemberConfig({
                ...payload,
                Private: +(model.private === MEMBER_PRIVATE.UNREADABLE),
            }),
        }).then(({ Member }) => Member);

        const memberAddresses = await createAddressesForMember({
            api,
            member: Member,
            addresses: model.addresses,
        });

        let memberWithKeys: Member | undefined;
        organizationKey = await dispatch(organizationKeyThunk()); // Ensure latest key
        if (!model.private && organizationKey?.privateKey) {
            const { keyTransparencyVerify, keyTransparencyCommit } = createKTVerifier({
                config: extra.config,
                api,
                ktActivation: dispatch(getKTActivation()),
            });
            const result = await setupMemberKeys({
                api,
                ownerAddresses,
                member: Member,
                memberAddresses,
                organizationKey: organizationKey.privateKey,
                keyGenConfig: KEYGEN_CONFIGS[DEFAULT_KEYGEN_TYPE],
                password: model.password,
                keyTransparencyVerify,
            });
            memberWithKeys = result.Member;
            await keyTransparencyCommit(user, userKeys);
        }

        if (model.role === MEMBER_ROLE.ORGANIZATION_ADMIN) {
            organizationKey = await dispatch(organizationKeyThunk()); // Ensure latest key
            if (getIsPasswordless(organizationKey?.Key)) {
                if (!model.private && memberWithKeys) {
                    const memberKeyPayload = await getMemberKeyPayload({
                        organizationKey,
                        member: memberWithKeys,
                        memberAddresses,
                        mode: {
                            type: 'email',
                            ktUserContext: await dispatch(getKTUserContext()),
                        },
                        api,
                    });
                    await dispatch(setAdminRoles({ api, memberKeyPayloads: [memberKeyPayload] }));
                } else {
                    // Ignore, can't set private users admins on creation because they don't have keys setup
                }
            } else {
                await api(updateRoleConfig(Member.ID, MEMBER_ROLE.ORGANIZATION_ADMIN));
            }
        }

        const [updatedMember] = await Promise.all([
            getMember(api, Member.ID),
            // Upserting the member also has an effect on the org values, so they need to be updated too.
            single ? dispatch(organizationThunk({ cache: CacheType.None })) : undefined,
        ]);
        dispatch(upsertMember({ member: updatedMember }));
        return updatedMember;
    };
};

export const deleteMember = ({
    api,
    member,
}: {
    member: Member;
    api: Api;
}): ThunkAction<Promise<void>, MembersState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch) => {
        if (member.Role === MEMBER_ROLE.ORGANIZATION_ADMIN) {
            await api(updateRoleConfig(member.ID, MEMBER_ROLE.ORGANIZATION_MEMBER));
        }
        await api(deleteMemberConfig(member.ID));
        dispatch(upsertMember({ member, type: 'delete' }));
    };
};

export const disableMember = ({
    api,
    member,
}: {
    member: Member;
    api: Api;
}): ThunkAction<Promise<void>, MembersState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch) => {
        await api(disableMemberConfig(member.ID));
        dispatch(upsertMember({ member: await getMember(api, member.ID) }));
    };
};

export const enableMember = ({
    api,
    member,
}: {
    member: Member;
    api: Api;
}): ThunkAction<Promise<void>, MembersState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch) => {
        await api(enableMemberConfig(member.ID));
        dispatch(upsertMember({ member: await getMember(api, member.ID) }));
    };
};

export const detachMemberSSO = ({
    api,
    member,
}: {
    member: Member;
    api: Api;
}): ThunkAction<
    Promise<void>,
    MemberState & MembersState & OrganizationKeyState,
    ProtonThunkArguments,
    UnknownAction
> => {
    return async (dispatch) => {
        await api(removeSSOSamlMember(member.ID));
        dispatch(upsertMember({ member: await getMember(api, member.ID) }));
    };
};

export const attachMemberSSO = ({
    api,
    member,
}: {
    member: Member;
    api: Api;
}): ThunkAction<
    Promise<void>,
    KtState & MemberState & MembersState & OrganizationKeyState,
    ProtonThunkArguments,
    UnknownAction
> => {
    return async (dispatch) => {
        if (
            member.Private === MEMBER_PRIVATE.UNREADABLE &&
            member.Self &&
            member.Role === MEMBER_ROLE.ORGANIZATION_ADMIN
        ) {
            await dispatch(unprivatizeSelf({ member, api }));
        }
        await api(addSSOSamlMember(member.ID));
        dispatch(upsertMember({ member: await getMember(api, member.ID) }));
    };
};

interface InviteMemberPayload {
    email: string;
    storage: number;
    numAI: boolean | undefined;
    lumo: boolean | undefined;
}
export const createInvite = ({
    email,
    storage,
    numAI,
    lumo,
}: InviteMemberPayload): ThunkAction<
    Promise<void>,
    KtState & MemberState & MembersState & OrganizationKeyState,
    ProtonThunkArguments,
    UnknownAction
> => {
    return async (dispatch, getState, extra) => {
        const { Member } = await extra.api<{ Member: Member }>(
            inviteMember({
                email,
                maxSpace: storage,
                maxAI: numAI === undefined ? undefined : numAI ? 1 : 0,
                maxLumo: lumo === undefined ? undefined : lumo ? 1 : 0,
            })
        );
        dispatch(upsertMember({ member: Member }));
        dispatch(organizationThunk({ cache: CacheType.None }));
    };
};

export const editInvite = ({
    member,
    memberDiff,
}: {
    member: Member;
    memberDiff: Partial<InviteMemberPayload>;
}): ThunkAction<
    Promise<{ member: Member; diff: boolean }>,
    KtState & MemberState & MembersState & OrganizationKeyState,
    ProtonThunkArguments,
    UnknownAction
> => {
    return async (dispatch, getState, extra) => {
        const api = extra.api;
        let diff = false;
        if (memberDiff.storage !== undefined) {
            await api(editMemberInvitation(member.ID, memberDiff.storage));
            diff = true;
        }
        if (memberDiff.numAI !== undefined) {
            await api(updateAI(member.ID, memberDiff.numAI ? 1 : 0));
            diff = true;
        }
        if (memberDiff.lumo !== undefined) {
            await api(updateLumo(member.ID, memberDiff.lumo ? 1 : 0));
            diff = true;
        }
        if (diff) {
            const [updatedMember] = await Promise.all([
                getMember(api, member.ID),
                // Upserting the member also has an effect on the org values, so they need to be updated too.
                dispatch(organizationThunk({ cache: CacheType.None })),
            ]);
            dispatch(upsertMember({ member: updatedMember }));
            return { member: updatedMember, diff: true };
        }
        return { member, diff: false };
    };
};
