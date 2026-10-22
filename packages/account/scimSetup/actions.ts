import type { ThunkDispatch, UnknownAction } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types/interface';
import { CacheType } from '@proton/redux-utilities/interface';
import { scheduleOrgKeyDemotions } from '@proton/shared/lib/api/members';
import { ADDRESS_FLAGS } from '@proton/shared/lib/constants';
import type { Api } from '@proton/shared/lib/interfaces/Api';
import type { Group } from '@proton/shared/lib/interfaces/Group';
import type { GroupMember } from '@proton/shared/lib/interfaces/GroupMember';
import type { Member, MemberReadyForManualUnprivatization } from '@proton/shared/lib/interfaces/Member';
import chunk from '@proton/utils/chunk';

import { type GroupMembersState, groupMembersThunk } from '../groupMembers';
import { type GroupsState, updateGroup } from '../groups';
import { createKeysForGroup } from '../groups/actions';
import { addGroupMemberKeysThunk } from '../groups/addGroupMember';
import type { KtState } from '../kt';
import { type MembersState, getMemberRolesBatch, invalidateMemberRoles } from '../members';
import { unprivatizeMembersManual } from '../members/unprivatizeMembers';
import type { OrganizationKeyState } from '../organizationKey';
import type { OrganizationRolesState } from '../organizationRoles';
import { ItemStatus, OrgKeyDemotionApproval, Phase } from './index';

type RequiredState = GroupsState &
    GroupMembersState &
    MembersState &
    OrganizationKeyState &
    OrganizationRolesState &
    KtState;

type ScimDispatch = ThunkDispatch<RequiredState, ProtonThunkArguments, UnknownAction>;

type GetMemberPublicKeys = Parameters<typeof addGroupMemberKeysThunk>[0]['getMemberPublicKeys'];

/**
 * Progress events emitted by {@link approveScimChanges}. Each value is a self-describing
 * "direct update" — the consumer decides how to apply it (dispatch to the store, collect
 * in a test, etc.). The generator itself stays free of any state-write/UI concerns.
 */
export type ScimProgress =
    | { type: 'phase'; phase: Phase }
    | {
          type: 'initStatuses';
          userStatuses: Record<string, ItemStatus>;
          groupStatuses: Record<string, ItemStatus>;
          groupMemberStatuses: Record<string, ItemStatus>;
      }
    | { type: 'userStatuses'; statuses: Record<string, ItemStatus> }
    | { type: 'groupStatus'; groupID: string; status: ItemStatus }
    | { type: 'groupMemberStatus'; memberID: string; status: ItemStatus }
    | { type: 'orgKeyDemotion'; approval: OrgKeyDemotionApproval }
    | { type: 'error'; error: unknown };

interface ScimApprovalDeps {
    usersToApprove: MemberReadyForManualUnprivatization[];
    groupsToApprove: Group[];
    pendingMembersByGroup: Record<string, GroupMember[]>;
    membersToDemote: Member[];
    api: Api;
    getMemberPublicKeys: GetMemberPublicKeys;
    dispatch: ScimDispatch;
}

/** Re-reads the org key demotion flags of the given members, which nothing else refetches when a task settles. */
export const refreshOrgKeyDemotionState =
    ({ members }: { members: Member[] }) =>
    async (dispatch: ScimDispatch) => {
        members.forEach((member) => dispatch(invalidateMemberRoles({ member })));
        await dispatch(getMemberRolesBatch({ members }));
    };

const ORG_KEY_DEMOTIONS_CHUNK_SIZE = 1000;

async function* processScimGroup(
    group: Group,
    { pendingMembersByGroup, api, getMemberPublicKeys, dispatch }: ScimApprovalDeps
): AsyncGenerator<ScimProgress> {
    yield { type: 'groupStatus', groupID: group.ID, status: ItemStatus.Finalizing };

    let resolvedGroup = group;
    if (!group.Address.HasKeys) {
        const e2eeDisabledGroup: Group = {
            ...group,
            Address: {
                ...group.Address,
                Flags: (group.Address?.Flags ?? 0) | ADDRESS_FLAGS.FLAG_DISABLE_E2EE,
            },
        };
        resolvedGroup = await dispatch(createKeysForGroup({ group: e2eeDisabledGroup, api }));
        dispatch(updateGroup(resolvedGroup));
    }

    const pendingKeysGroupMembers = pendingMembersByGroup[group.ID] ?? [];

    let allCompleted = true;
    if (pendingKeysGroupMembers.length) {
        for (const groupMember of pendingKeysGroupMembers) {
            yield { type: 'groupMemberStatus', memberID: groupMember.ID, status: ItemStatus.Finalizing };
            try {
                await dispatch(
                    addGroupMemberKeysThunk({
                        groupMember,
                        groupAddress: resolvedGroup.Address,
                        getMemberPublicKeys,
                    })
                );
                yield { type: 'groupMemberStatus', memberID: groupMember.ID, status: ItemStatus.Completed };
            } catch (e) {
                yield { type: 'groupMemberStatus', memberID: groupMember.ID, status: ItemStatus.Waiting };
                allCompleted = false;
            }
        }
        await dispatch(groupMembersThunk({ groupId: group.ID, cache: CacheType.None }));
    }

    yield {
        type: 'groupStatus',
        groupID: group.ID,
        status: allCompleted ? ItemStatus.Completed : ItemStatus.Waiting,
    };
}

// TODO: Add error handling - now we just move back item status to "Waiting"
export async function* approveScimChanges(deps: ScimApprovalDeps): AsyncGenerator<ScimProgress> {
    const { usersToApprove, groupsToApprove, pendingMembersByGroup, membersToDemote, api, dispatch } = deps;

    // Set initial statuses to user, groups and group members
    yield { type: 'phase', phase: Phase.Working };
    yield {
        type: 'initStatuses',
        userStatuses: Object.fromEntries(usersToApprove.map(({ ID }) => [ID, ItemStatus.Finalizing])),
        groupStatuses: Object.fromEntries(groupsToApprove.map(({ ID }) => [ID, ItemStatus.Waiting])),
        groupMemberStatuses: Object.fromEntries(
            groupsToApprove.flatMap(({ ID }) =>
                (pendingMembersByGroup[ID] ?? []).map(({ ID: memberID }) => [memberID, ItemStatus.Waiting])
            )
        ),
    };

    try {
        if (membersToDemote.length) {
            yield { type: 'orgKeyDemotion', approval: OrgKeyDemotionApproval.Requested };

            try {
                for (const chunkToDemote of chunk(membersToDemote, ORG_KEY_DEMOTIONS_CHUNK_SIZE)) {
                    await api(scheduleOrgKeyDemotions(chunkToDemote.map(({ ID }) => ID)));
                }
            } catch (e) {
                yield { type: 'orgKeyDemotion', approval: OrgKeyDemotionApproval.None };
                throw e;
            }
            await dispatch(refreshOrgKeyDemotionState({ members: membersToDemote }));
            yield { type: 'orgKeyDemotion', approval: OrgKeyDemotionApproval.Enqueued };
        }

        if (usersToApprove.length) {
            await dispatch(unprivatizeMembersManual({ membersToUnprivatize: usersToApprove }));
            yield {
                type: 'userStatuses',
                statuses: Object.fromEntries(usersToApprove.map(({ ID }) => [ID, ItemStatus.Completed])),
            };
        }

        if (groupsToApprove.length) {
            let hasGroupError = false;

            for (const group of groupsToApprove) {
                try {
                    yield* processScimGroup(group, deps);
                } catch (e) {
                    yield { type: 'error', error: e };
                    hasGroupError = true;
                }
            }

            if (hasGroupError) {
                yield { type: 'phase', phase: Phase.Idle };
                return;
            }
        }

        yield { type: 'phase', phase: Phase.Done };
    } catch (e) {
        yield { type: 'error', error: e };
        yield { type: 'phase', phase: Phase.Idle };
    }
}
