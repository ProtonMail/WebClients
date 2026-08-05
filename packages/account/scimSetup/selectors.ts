import { createSelector } from '@reduxjs/toolkit';

import { EntitlementName } from '@proton/payments/core/entitlements/entitlement-names';
import { getOrgEntitlementQuantity } from '@proton/payments/core/entitlements/helpers';
import { type EnhancedMember, GROUP_MEMBER_STATE } from '@proton/shared/lib/interfaces';
import type { GroupMember } from '@proton/shared/lib/interfaces/GroupMember';
import { getIsMemberSetup } from '@proton/shared/lib/keys/memberHelper';

import { selectEntitlements } from '../entitlements';
import { selectGroupMembers } from '../groupMembers';
import { selectGroups } from '../groups';
import { getIsScimGroup, getIsScimGroupPendingKeys } from '../groups/groupFlags';
import { selectMembers } from '../members';
import { selectJoinedUnprivatizationState } from '../members/unprivatizeMembers';
import { selectOrganization } from '../organization';
import hasKeylessSsoEntitlement from './hasKeylessSsoEntitlement';

/** Members awaiting manual approval (unprivatization). */
export const selectPendingScimUsers = createSelector(selectJoinedUnprivatizationState, (joinedState) =>
    joinedState.approval.map(({ member }) => member)
);

/** Pending-admin members keyed by group ID. */
export const selectPendingScimMembersByGroup = createSelector(
    selectGroups,
    selectGroupMembers,
    selectMembers,
    (groupsState, groupMembersState, membersState) => {
        const addressToMemberMap: Record<string, EnhancedMember | undefined> = {};
        for (const member of membersState.value ?? []) {
            for (const address of member.Addresses ?? []) {
                addressToMemberMap[address.ID] = member;
            }
        }

        const pendingMembersByGroup: Record<string, GroupMember[]> = {};
        for (const group of groupsState.value ?? []) {
            const groupMembers = groupMembersState[group.ID]?.value;
            if (groupMembers) {
                pendingMembersByGroup[group.ID] = Object.values(groupMembers).filter((m) => {
                    if (m.State !== GROUP_MEMBER_STATE.PENDING_ADMIN_APPROVAL) {
                        return false;
                    }

                    return getIsMemberSetup(m.AddressID ? addressToMemberMap[m.AddressID] : undefined);
                });
            }
        }
        return pendingMembersByGroup;
    }
);

/**
 * Groups that need finalizing during SCIM setup: newly synced groups still missing keys, plus
 * existing SCIM groups that have keys but gained pending-admin members.
 */
export const selectPendingScimGroups = createSelector(
    selectOrganization,
    selectGroups,
    selectPendingScimMembersByGroup,
    selectEntitlements,
    (organizationState, groupsState, pendingMembersByGroup, entitlementsState) => {
        // Orgs on plans with the keyless-sso entitlement must not see or approve pending SCIM groups.
        if (hasKeylessSsoEntitlement(organizationState.value?.PlanName)) {
            return [];
        }

        // Same for orgs whose plan doesn't grant the groups entitlement, and while entitlements load.
        if (!entitlementsState.value || !getOrgEntitlementQuantity(entitlementsState.value, EntitlementName.Groups)) {
            return [];
        }

        const groups = groupsState.value ?? [];
        const newGroups = groups.filter(getIsScimGroupPendingKeys);
        const updatedGroups = groups.filter(
            (group) =>
                getIsScimGroup(group) && group.Address.HasKeys && (pendingMembersByGroup[group.ID]?.length ?? 0) > 0
        );
        return [...newGroups, ...updatedGroups];
    }
);
