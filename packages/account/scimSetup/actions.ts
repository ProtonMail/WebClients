import type { ThunkDispatch, UnknownAction } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { CacheType } from '@proton/redux-utilities/interface';
import type { Api, Group, MemberReadyForManualUnprivatization } from '@proton/shared/lib/interfaces';
import { GROUP_MEMBER_STATE } from '@proton/shared/lib/interfaces';
import type { GroupMember } from '@proton/shared/lib/interfaces/GroupMember';

import { type GroupMembersState, groupMembersThunk } from '../groupMembers';
import { type GroupsState, updateGroup } from '../groups';
import { createKeysForGroup } from '../groups/actions';
import { addGroupMemberKeysThunk } from '../groups/addGroupMember';
import type { KtState } from '../kt';
import type { MembersState } from '../members';
import { unprivatizeMembersManual } from '../members/unprivatizeMembers';
import type { OrganizationKeyState } from '../organizationKey';
import { ItemStatus, Phase } from './index';

type RequiredState = GroupsState & GroupMembersState & MembersState & OrganizationKeyState & KtState;

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
    | { type: 'error'; error: unknown };

interface ScimApprovalDeps {
    usersToApprove: MemberReadyForManualUnprivatization[];
    groupsToApprove: Group[];
    pendingMembersByGroup: Record<string, GroupMember[]>;
    api: Api;
    getMemberPublicKeys: GetMemberPublicKeys;
    dispatch: ScimDispatch;
}

async function* processScimGroup(
    group: Group,
    { api, getMemberPublicKeys, dispatch }: ScimApprovalDeps
): AsyncGenerator<ScimProgress> {
    yield { type: 'groupStatus', groupID: group.ID, status: ItemStatus.Finalizing };

    let resolvedGroup = group;
    if (!group.Address.HasKeys) {
        resolvedGroup = await dispatch(createKeysForGroup({ group, api }));
        dispatch(updateGroup(resolvedGroup));
    }

    const members = await dispatch(groupMembersThunk({ groupId: resolvedGroup.ID, cache: CacheType.None }));
    const pendingAdmins = Object.values(members).filter((m) => m.State === GROUP_MEMBER_STATE.PENDING_ADMIN);

    let allCompleted = true;
    if (pendingAdmins.length) {
        for (const groupMember of pendingAdmins) {
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
    const { usersToApprove, groupsToApprove, pendingMembersByGroup, dispatch } = deps;

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
