import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit';
import { c } from 'ttag';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types/interface';
import { CacheType } from '@proton/redux-utilities/interface';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import {
    addSSOSamlMember,
    deleteMember as deleteMemberConfig,
    disableMember as disableMemberConfig,
    enableMember as enableMemberConfig,
    privatizeMember as privatizeMemberConfig,
    removeSSOSamlMember,
    updateRole as updateRoleConfig,
    updateVPN,
} from '@proton/shared/lib/api/members';
import { MEMBER_PRIVATE, MEMBER_ROLE, VPN_CONNECTIONS } from '@proton/shared/lib/constants';
import type { Api } from '@proton/shared/lib/interfaces/Api';
import type { EnhancedMember, Member } from '@proton/shared/lib/interfaces/Member';
import type { Organization } from '@proton/shared/lib/interfaces/Organization';
import type { RoleAssignment } from '@proton/shared/lib/interfaces/OrganizationRole';
import { ROLE_SOURCE } from '@proton/shared/lib/interfaces/OrganizationRole';
import { getIsMemberSetup } from '@proton/shared/lib/keys/memberHelper';
import { getIsPasswordless } from '@proton/shared/lib/keys/organizationKeys';
import { getHasIncompleteOrgKeyGrant } from '@proton/shared/lib/organization/helper';
import noop from '@proton/utils/noop';

import type { KtState } from '../kt';
import type { MemberState } from '../member';
import { type OrganizationState, organizationThunk } from '../organization';
import type { OrganizationKeyState } from '../organizationKey';
import { organizationKeyThunk } from '../organizationKey';
import {
    type MemberKeyPayload,
    type PromoteGlobalSSOPayload,
    getMemberEditPayload,
    setAdminRoles,
} from '../organizationKey/actions';
import { classifyRoleChange, getIsMemberAdminOrPendingAdmin } from '../organizationKey/classifyRoleChange';
import { type OrganizationRolesState, organizationRolesThunk } from '../organizationRoles';
import { isOrgKeyRequired } from '../organizationRoles/helpers';
import { userThunk } from '../user';
import MemberCreationValidationError from './errors/MemberCreationValidationError';
import { getMember } from './getMember';
import {
    type MembersState,
    type RoleAssignmentsResult,
    getMemberRoles,
    invalidateMemberRoles,
    membersThunk,
    updateMemberRoles,
    upsertMember,
} from './index';
import { getMemberUnprivatizationMode } from './memberUnprivatization';
import { deleteRequestUnprivatization, requestUnprivatization, unprivatizeSelf } from './unprivatizeActions';
import { updateOwnerRole } from './updateOwnerRole';

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
        if (success.length > 0) {
            // Ensure org used member get updated
            dispatch(organizationThunk({ cache: CacheType.None })).catch(noop);
        }
        return { success, failure };
    };
};

export const setRole = ({
    member,
    payload,
    api,
    role,
    syncOwner = false,
}: {
    member: Member;
    payload: PromoteGlobalSSOPayload | MemberKeyPayload | null;
    api: Api;
    role: MEMBER_ROLE;
    syncOwner?: boolean;
}): ThunkAction<
    Promise<void>,
    MembersState & OrganizationKeyState & OrganizationRolesState,
    ProtonThunkArguments,
    UnknownAction
> => {
    return async (dispatch) => {
        // demotion
        if (role === MEMBER_ROLE.ORGANIZATION_MEMBER) {
            if (payload?.type === 'promote-global-sso') {
                if (syncOwner) {
                    // Safe for legacy pending admin invitations where the member never held Owner:
                    // the endpoint returns success and skips removing a role that isn't assigned,
                    // so deleteRequestUnprivatization below still runs
                    await dispatch(updateOwnerRole({ member, makeAdmin: false, api }));
                }
                await dispatch(deleteRequestUnprivatization({ member, api }));
                return;
            }
            const didSyncOwnerRole = syncOwner && (await dispatch(updateOwnerRole({ member, makeAdmin: false, api })));
            // Removing the owner role doesn't always demote, e.g. when the member didn't hold it directly
            const isDemoted =
                didSyncOwnerRole && (await getMember(api, member.ID)).Role !== MEMBER_ROLE.ORGANIZATION_ADMIN;
            if (!isDemoted) {
                await api(updateRoleConfig(member.ID, MEMBER_ROLE.ORGANIZATION_MEMBER));
            }
            dispatch(invalidateMemberRoles({ member }));
            return;
        }

        const organizationKey = await dispatch(organizationKeyThunk());

        if (!getIsPasswordless(organizationKey?.Key)) {
            if (syncOwner) {
                await dispatch(updateOwnerRole({ member, makeAdmin: true, api }));
            }
            await api(updateRoleConfig(member.ID, MEMBER_ROLE.ORGANIZATION_ADMIN));
            dispatch(invalidateMemberRoles({ member }));
            return;
        }

        if (!payload) {
            throw new Error('Missing payload');
        }

        // promotion
        if (payload.type === 'promote-global-sso') {
            if (getIsMemberSetup(member) || !member.SSO) {
                throw new MemberCreationValidationError('Unexpected request');
            }
            if (syncOwner) {
                await dispatch(updateOwnerRole({ member, makeAdmin: true, api }));
            }
            // For VPN SSO users we request unprivatization with admin flag to convert them to global sso users
            await dispatch(requestUnprivatization({ member, api, makeAdmin: true }));
            return;
        }

        if (syncOwner) {
            await dispatch(updateOwnerRole({ member, makeAdmin: true, api }));
        }
        await dispatch(setAdminRoles({ memberKeyPayloads: [payload], api }));
        dispatch(invalidateMemberRoles({ member }));
    };
};

export const assignMemberRoles = ({
    member,
    currentRoles,
    desiredRoleIds,
    payload,
    api,
}: {
    member: Member;
    currentRoles: RoleAssignment[];
    desiredRoleIds: Set<string>;
    payload: PromoteGlobalSSOPayload | MemberKeyPayload | null;
    api: Api;
}): ThunkAction<
    Promise<RoleAssignmentsResult>,
    KtState & OrganizationKeyState & MembersState & OrganizationRolesState,
    ProtonThunkArguments,
    UnknownAction
> => {
    return async (dispatch) => {
        const organizationRoles = await dispatch(organizationRolesThunk());

        const desiredRolesRequireOrgKey = organizationRoles.some(
            (role) => desiredRoleIds.has(role.OrganizationRoleID) && isOrgKeyRequired(role)
        );
        const currentRolesRequireOrgKey = currentRoles.some(({ Role }) => isOrgKeyRequired(Role));
        const groupRolesRequireOrgKey = currentRoles.some(
            ({ Role, Source }) => Source === ROLE_SOURCE.GROUP && isOrgKeyRequired(Role)
        );
        const removesLastOrgKeyRole =
            currentRolesRequireOrgKey && !desiredRolesRequireOrgKey && !groupRolesRequireOrgKey;

        if (!desiredRolesRequireOrgKey || currentRolesRequireOrgKey || getIsMemberAdminOrPendingAdmin(member)) {
            if (removesLastOrgKeyRole && getMemberUnprivatizationMode(member).makeAdmin) {
                await dispatch(deleteRequestUnprivatization({ member, api }));
            }
            return dispatch(updateMemberRoles({ member, currentRoles, desiredRoleIds, api }));
        }

        const organizationKey = await dispatch(organizationKeyThunk());
        const classification = classifyRoleChange({
            member,
            targetRole: MEMBER_ROLE.ORGANIZATION_ADMIN,
            isPasswordlessOrg: getIsPasswordless(organizationKey?.Key),
        });

        const requiresPayload = classification.kind === 'promote' && classification.via !== 'no-payload';
        if (requiresPayload && payload === null) {
            payload = await dispatch(getMemberEditPayload({ member, classification, api }));
        }

        // The order is IMPORTANT here: set admin roles first, promote second
        const roleAssignments = await dispatch(updateMemberRoles({ member, currentRoles, desiredRoleIds, api }));
        await dispatch(setRole({ member, role: MEMBER_ROLE.ORGANIZATION_ADMIN, payload, api }));

        // Refresh the UI before next event loop update (banner shows), but fail gracefully.
        await getMember(api, member.ID)
            .then((updatedMember) => dispatch(upsertMember({ member: updatedMember })))
            .catch(noop);
        await dispatch(getMemberRoles({ member, cache: CacheType.None })).catch(noop);
        // The promotion is a change on its own, even when the role assignments stay the same.
        return { ...roleAssignments, changed: true };
    };
};

export const provideOrgKeyAccessToMember = ({
    member,
    api,
}: {
    member: EnhancedMember;
    api: Api;
}): ThunkAction<
    Promise<void>,
    KtState & OrganizationKeyState & MembersState & OrganizationRolesState,
    ProtonThunkArguments,
    UnknownAction
> => {
    return async (dispatch) => {
        if (getIsMemberAdminOrPendingAdmin(member)) {
            return;
        }
        const organizationKey = await dispatch(organizationKeyThunk());
        const classification = classifyRoleChange({
            member,
            targetRole: MEMBER_ROLE.ORGANIZATION_ADMIN,
            isPasswordlessOrg: getIsPasswordless(organizationKey?.Key),
        });
        const payload = await dispatch(getMemberEditPayload({ member, classification, api: getSilentApi(api) }));
        await dispatch(setRole({ member, role: MEMBER_ROLE.ORGANIZATION_ADMIN, payload, api }));

        // Refresh UI before next event loop, but fail gracefully
        await getMember(api, member.ID)
            .then((updatedMember) => dispatch(upsertMember({ member: updatedMember })))
            .catch(noop);
    };
};

/**
 * Resume a role assignment that stalled before the member was granted access to the org key.
 */
export const resumeMemberRoleAssignment = ({
    memberID,
    api,
}: {
    memberID: string;
    api: Api;
}): ThunkAction<
    Promise<void>,
    KtState & OrganizationKeyState & MembersState & OrganizationRolesState,
    ProtonThunkArguments,
    UnknownAction
> => {
    return async (dispatch) => {
        const member = (await dispatch(membersThunk())).find(({ ID }) => ID === memberID);
        if (!member) {
            return;
        }
        await dispatch(provideOrgKeyAccessToMember({ member, api }));
        // Required: `provideOrgKeyAccessToMember` refreshes the member, but preserves the pending flag
        // Refresh the roles to clear pending flag
        await dispatch(getMemberRoles({ member, cache: CacheType.None }));
        const refreshed = (await dispatch(membersThunk())).find(({ ID }) => ID === memberID);
        if (refreshed && getHasIncompleteOrgKeyGrant(refreshed) && !getMemberUnprivatizationMode(refreshed).makeAdmin) {
            // TODO: provideOrgKeyAccessToMember no-ops for a member who is already an admin but lost access to
            // the org key. To fix that, we need to change `classifyRoleChange` to allow admin -> admin.
            throw new Error(c('Error').t`Could not grant access to the organization key`);
        }
    };
};

export const privatizeMember = ({
    api,
    member,
    orgKeyResetPrivatization,
}: {
    api: Api;
    member: Member;
    /**
     * Flags the member as privatized by the organization key reset flow, so that the reset can be resumed and the
     * member unprivatized again afterwards. It also lets the API skip the private members entitlement check.
     */
    orgKeyResetPrivatization?: boolean;
}): ThunkAction<Promise<void>, OrganizationKeyState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch) => {
        await api(
            privatizeMemberConfig(member.ID, orgKeyResetPrivatization ? { OrgKeyResetPrivatization: true } : undefined)
        );
        if (member.Self) {
            await dispatch(userThunk({ cache: CacheType.None }));
        }
    };
};

// This resets the VPN connections of the admin to the default value, since this gets reset by the API when changing subscriptions etc
export const resetSelfVpnConnectionsHelper = async ({
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

export const deleteMember = ({
    api,
    member,
}: {
    member: Member;
    api: Api;
}): ThunkAction<
    Promise<void>,
    MembersState & OrganizationState & OrganizationKeyState & OrganizationRolesState,
    ProtonThunkArguments,
    UnknownAction
> => {
    return async (dispatch) => {
        if (member.Role === MEMBER_ROLE.ORGANIZATION_ADMIN) {
            await dispatch(
                setRole({ member, role: MEMBER_ROLE.ORGANIZATION_MEMBER, payload: null, api, syncOwner: true })
            );
        }
        await api(deleteMemberConfig(member.ID));
        dispatch(upsertMember({ member, type: 'delete' }));
        // Ensure org used member get updated
        dispatch(organizationThunk({ cache: CacheType.None })).catch(noop);
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
    KtState & MemberState & MembersState & OrganizationKeyState & OrganizationRolesState,
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
