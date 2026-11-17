import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types/interface';
import { CacheType } from '@proton/redux-utilities/interface';
import { updateAI, updateLumo, updateName, updateQuota, updateVPN } from '@proton/shared/lib/api/members';
import { MEMBER_PRIVATE, MEMBER_ROLE, VPN_CONNECTIONS } from '@proton/shared/lib/constants';
import type { Api } from '@proton/shared/lib/interfaces/Api';
import type { EnhancedMember, Member } from '@proton/shared/lib/interfaces/Member';
import { getIsPasswordless } from '@proton/shared/lib/keys/organizationKeys';
import noop from '@proton/utils/noop';

import type { KtState } from '../kt';
import type { MemberState } from '../member';
import { organizationThunk } from '../organization';
import { type OrganizationKeyState, organizationKeyThunk } from '../organizationKey';
import {
    type MemberEditPayload,
    type MemberKeyPayload,
    type PromoteGlobalSSOPayload,
    getMemberEditPayload,
} from '../organizationKey/actions';
import { classifyRoleChange, getIsMemberAdminOrPendingAdmin } from '../organizationKey/classifyRoleChange';
import { type OrganizationRolesState, organizationRolesThunk } from '../organizationRoles';
import { hasUserSourcedOwnerRole, isOrgKeyRequired, isOwnerRole } from '../organizationRoles/helpers';
import { assignMemberRoles, privatizeMember, resetSelfVpnConnectionsHelper, setRole } from './actions';
import type { CreateMemberPayload } from './createMember';
import { getMember } from './getMember';
import { type MembersState, membersThunk, upsertMember } from './index';
import { getMemberUnprivatizationMode } from './memberUnprivatization';
import { deleteRequestUnprivatization, requestUnprivatization, unprivatizeSelf } from './unprivatizeActions';

export const editMember = ({
    member,
    memberDiff,
    memberKeyPacketPayload,
    roleIds,
    api,
}: {
    member: EnhancedMember;
    memberDiff: Partial<CreateMemberPayload>;
    memberKeyPacketPayload: PromoteGlobalSSOPayload | MemberKeyPayload | null;
    roleIds?: Set<string>;
    api: Api;
}): ThunkAction<
    Promise<{ diff: boolean; member: Member | null }>,
    KtState & MemberState & MembersState & OrganizationKeyState & OrganizationRolesState,
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
                await resetSelfVpnConnectionsHelper({ api, members, organization }).catch(noop);
            }
            await api(updateVPN(member.ID, memberDiff.vpn ? VPN_CONNECTIONS : 0));
        }
        if (memberDiff.numAI !== undefined) {
            await api(updateAI(member.ID, memberDiff.numAI ? 1 : 0));
        }
        if (memberDiff.lumo !== undefined) {
            await api(updateLumo(member.ID, memberDiff.lumo ? 1 : 0));
        }
        if (memberDiff.role === MEMBER_ROLE.ORGANIZATION_ADMIN || memberDiff.role === MEMBER_ROLE.ORGANIZATION_MEMBER) {
            await dispatch(
                setRole({
                    member,
                    payload: memberKeyPacketPayload,
                    api,
                    role: memberDiff.role,
                    syncOwner: true,
                })
            );
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
        let updatedMember: Member | null = null;
        if (Object.values(memberDiff).some((value) => value !== undefined)) {
            [updatedMember] = await Promise.all([
                getMember(api, member.ID),
                // Upserting the member also has an effect on the org values, so they need to be updated too.
                dispatch(organizationThunk({ cache: CacheType.None })),
            ]);
            dispatch(upsertMember({ member: updatedMember }));
        }
        // After the refresh, so that the store has the saved fields even if the role change fails
        let rolesChanged = false;
        if (roleIds) {
            const result = await dispatch(
                assignMemberRoles({
                    member,
                    currentRoles: member.UserOrganizationRoles ?? [],
                    desiredRoleIds: roleIds,
                    payload: null,
                    api,
                })
            );
            rolesChanged = result.changed;
        }
        return { diff: updatedMember !== null || rolesChanged, member: updatedMember };
    };
};

export const confirmMemberRoleChange = ({
    member,
    targetRole,
    api,
    confirm,
}: {
    member: EnhancedMember;
    targetRole: MEMBER_ROLE;
    api: Api;
    confirm: (action: MemberEditPayload) => Promise<boolean>;
}): ThunkAction<
    Promise<{ confirmed: boolean; payload: PromoteGlobalSSOPayload | MemberKeyPayload | null }>,
    KtState & OrganizationKeyState,
    ProtonThunkArguments,
    UnknownAction
> => {
    return async (dispatch) => {
        const organizationKey = await dispatch(organizationKeyThunk());
        const classification = classifyRoleChange({
            member,
            targetRole,
            isPasswordlessOrg: getIsPasswordless(organizationKey?.Key),
        });
        const payload = await dispatch(getMemberEditPayload({ member, classification, api }));
        if (!classification.requiresPrompt) {
            return { confirmed: true, payload };
        }
        return { confirmed: await confirm({ classification, payload }), payload };
    };
};

export const setMemberOwnerRole = ({
    member,
    makeAdmin,
    api,
    confirm,
}: {
    member: EnhancedMember;
    makeAdmin: boolean;
    api: Api;
    confirm: (action: MemberEditPayload) => Promise<boolean>;
}): ThunkAction<
    Promise<{ confirmed: false } | { confirmed: true; changed: boolean; desiredRoleIds: Set<string> }>,
    KtState & MemberState & MembersState & OrganizationKeyState & OrganizationRolesState,
    ProtonThunkArguments,
    UnknownAction
> => {
    return async (dispatch) => {
        const organizationRoles = await dispatch(organizationRolesThunk());
        const ownerRoleId = organizationRoles.find(isOwnerRole)?.OrganizationRoleID;
        if (!ownerRoleId) {
            throw new Error('Missing owner role');
        }

        const currentRoles = member.UserOrganizationRoles ?? [];
        const hasOwnerRole = hasUserSourcedOwnerRole(currentRoles);
        const hasOtherOrgKeyRole = currentRoles.some(({ Role }) => !isOwnerRole(Role) && isOrgKeyRequired(Role));
        const unprivatization = getMemberUnprivatizationMode(member);

        let payload: PromoteGlobalSSOPayload | MemberKeyPayload | null = null;

        // need change in Member.Role in these cases:
        //  1. Promotion: member doesn't have Member.Role = Admin
        //  2. Demotion: member is an admin or pending admin without other admin roles that require org key access
        const changesLegacyRole = makeAdmin
            ? member.Role !== MEMBER_ROLE.ORGANIZATION_ADMIN
            : getIsMemberAdminOrPendingAdmin(member) && !hasOtherOrgKeyRole;
        if (changesLegacyRole) {
            const result = await dispatch(
                confirmMemberRoleChange({
                    member,
                    targetRole: makeAdmin ? MEMBER_ROLE.ORGANIZATION_ADMIN : MEMBER_ROLE.ORGANIZATION_MEMBER,
                    api,
                    confirm,
                })
            );
            if (!result.confirmed) {
                return { confirmed: false };
            }
            payload = result.payload;
        }

        const desiredRoleIds = new Set(currentRoles.map(({ Role }) => Role.OrganizationRoleID));
        if (makeAdmin) {
            desiredRoleIds.add(ownerRoleId);
        } else {
            desiredRoleIds.delete(ownerRoleId);
        }

        // A role change: assignMemberRoles also deletes the pending admin invitation when no org key role remains
        if (makeAdmin || hasOwnerRole) {
            const result = await dispatch(assignMemberRoles({ member, currentRoles, desiredRoleIds, payload, api }));
            return { confirmed: true, changed: result.changed, desiredRoleIds };
        }

        // The member holds no Owner role and has no pending admin invitation, so nothing changes
        if (!unprivatization.makeAdmin) {
            return { confirmed: true, changed: false, desiredRoleIds };
        }

        // The user cancels a pending admin invitation
        const { diff } = await dispatch(
            editMember({
                member,
                memberDiff: { role: MEMBER_ROLE.ORGANIZATION_MEMBER },
                memberKeyPacketPayload: payload,
                api,
            })
        );
        return { confirmed: true, changed: diff, desiredRoleIds };
    };
};
