import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit';
import { createSelector } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { CacheType } from '@proton/redux-utilities/interface';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { MEMBER_PRIVATE, MEMBER_ROLE } from '@proton/shared/lib/constants';
import type { EnhancedMember, Member } from '@proton/shared/lib/interfaces';
import type { KeyReactivationRequest } from '@proton/shared/lib/keys';
import {
    getIsMemberPendingOrgKeyResetUnprivatization,
    getMemberHasOrgKeyResetPrivatization,
} from '@proton/shared/lib/keys/memberHelper';
import { getMemberHasAccessToOrgKey } from '@proton/shared/lib/organization/helper';

import { selectKeyReactivationRequests } from '../inactiveKeys';
import type { MemberState } from '../member';
import { type MembersState, membersThunk, selectMembers, upsertMember } from '../members';
import { privatizeMember, requestUnprivatization, unprivatizeSelf } from '../members/actions';
import { getMember } from '../members/getMember';
import { type UserKeysState, selectUserKeys } from '../userKeys';
import { getKeyRotationPayload, rotatePasswordlessOrganizationKeys } from './actions';
import type { RotateOrganizationKeysState } from './actions';
import { organizationKeyThunk } from './index';

/**
 * The organization key reset runs in three phases. They are surfaced to the user as a progress list, and they also
 * define where an interrupted reset picks back up:
 * - `privatize`: every non-private member is temporarily converted to private and flagged with
 *   `MEMBER_FLAGS.OrgKeyResetPrivatization`. Without this the new organization key could not be handed out, since
 *   re-encrypting the member tokens requires the old (inaccessible) organization key.
 * - `rotate`: the organization key itself is reset.
 * - `unprivatize`: an unprivatization request is emailed to each member that was converted. The API clears the flag
 *   once a member accepts.
 */
export type ResetOrganizationKeyStep = 'privatize' | 'rotate' | 'unprivatize';

/**
 * `unprivatizeSelf` needs the single member and the member list models on top of what the rotation needs.
 */
export type ResetOrganizationKeyState = RotateOrganizationKeysState & MemberState & MembersState;

export type ResetOrganizationKeyStepStatus = 'pending' | 'running' | 'done';

export type OnResetOrganizationKeyStep = (step: ResetOrganizationKeyStep, status: 'running' | 'done') => void;

export interface RequestUnprivatizationResult {
    success: Member[];
    failure: { member: Member; error: any }[];
}

/**
 * Members that have to be converted to private before the organization key can be reset. This includes self: the
 * administrator running the flow is non-private just like anyone else, so their member token has to be re-encrypted
 * against the new organization key too. Privatizing self does not revoke the administrator's own session, so it does
 * not interrupt the reset.
 */
export const getMembersToPrivatizeForOrganizationKeyReset = (members: EnhancedMember[]) => {
    return members.filter((member) => member.Private === MEMBER_PRIVATE.READABLE);
};

export interface OrganizationKeyResetState {
    /**
     * False until the members and the user keys have loaded. Everything below reads as empty while that is the case,
     * which is indistinguishable from there genuinely being nothing, so branch on this first.
     */
    loaded: boolean;
    /**
     * The keys the administrator can recover through a data recovery method. Recovering them restores access to the
     * organization key on its own, which is preferable to resetting it.
     */
    keyReactivationRequests: KeyReactivationRequest[];
    /**
     * Administrators that still have access to the organization key. They can restore the privileges of the
     * administrator who lost theirs, which also avoids a reset.
     */
    otherAdminsWithKeyAccess: Member[];
    /**
     * Everyone that ends up needing to accept an unprivatization request: the members still to be converted, plus
     * the ones an earlier, interrupted attempt already converted.
     */
    affectedMembers: Member[];
}

/**
 * Everything the restore administrator privileges flow branches on. Note that it only reads the store, so the
 * members and user keys have to have been fetched elsewhere for `loaded` to ever turn true.
 */
export const selectOrganizationKeyResetState = createSelector(
    [
        (state: MembersState) => selectMembers(state).value,
        (state: UserKeysState) => selectUserKeys(state).value,
        selectKeyReactivationRequests,
    ],
    (members, userKeys, keyReactivationRequests): OrganizationKeyResetState => ({
        loaded: Boolean(members && userKeys),
        keyReactivationRequests,
        otherAdminsWithKeyAccess: (members || []).filter(
            (member) =>
                member.Role === MEMBER_ROLE.ORGANIZATION_ADMIN && !member.Self && getMemberHasAccessToOrgKey(member)
        ),
        affectedMembers: [
            ...(members || []).filter(getMemberHasOrgKeyResetPrivatization),
            ...getMembersToPrivatizeForOrganizationKeyReset(members || []),
        ],
    })
);

/**
 * Guards against the reset running twice at the same time. `resumeOrganizationKeyResetUnprivatization` is driven by a
 * store listener which reacts to the very member updates this job performs, so without it the resume job and the main
 * job would send duplicate unprivatization requests.
 */
let isResetRunning = false;

export const privatizeMembersForOrganizationKeyReset = ({
    members,
}: {
    members: Member[];
}): ThunkAction<Promise<void>, RotateOrganizationKeysState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, _, extra) => {
        if (!members.length) {
            return;
        }
        const api = getSilentApi(extra.api);
        extra.eventManager.stop();
        try {
            for (const member of members) {
                await dispatch(privatizeMember({ api, member, orgKeyResetPrivatization: true }));
                dispatch(upsertMember({ member: await getMember(api, member.ID) }));
            }
        } finally {
            extra.eventManager.start();
        }
    };
};

/**
 * Sends the unprivatization request to every member that is still flagged as privatized by an organization key reset.
 * The organization key must be active again, since the request is signed with it.
 *
 * Self goes through `unprivatizeSelf` instead, which requests and accepts the unprivatization in one go, so the
 * administrator running the reset ends up non-private again rather than sitting on a pending request.
 *
 * A member that cannot be invited back (e.g. their account was never set up) must not block the others: the key has
 * already been rotated at this point, so failures are collected and left for a later attempt instead of thrown.
 */
export const requestUnprivatizationForOrganizationKeyReset = ({
    members,
}: {
    members: Member[];
}): ThunkAction<
    Promise<RequestUnprivatizationResult>,
    ResetOrganizationKeyState,
    ProtonThunkArguments,
    UnknownAction
> => {
    return async (dispatch, _, extra) => {
        const result: RequestUnprivatizationResult = { success: [], failure: [] };
        if (!members.length) {
            return result;
        }
        const api = getSilentApi(extra.api);
        const selfMember = members.find((member) => member.Self);
        const otherMembers = members.filter((member) => !member.Self);
        extra.eventManager.stop();
        try {
            for (const member of otherMembers) {
                try {
                    await dispatch(requestUnprivatization({ api, member }));
                    const updatedMember = await getMember(api, member.ID);
                    dispatch(upsertMember({ member: updatedMember }));
                    result.success.push(updatedMember);
                } catch (error: any) {
                    result.failure.push({ member, error });
                }
            }
        } finally {
            extra.eventManager.start();
        }
        // Handled outside of the loop above since `unprivatizeSelf` stops and starts the event manager itself.
        if (selfMember) {
            try {
                await dispatch(unprivatizeSelf({ api, member: selfMember }));
                const updatedMember = await getMember(api, selfMember.ID);
                dispatch(upsertMember({ member: updatedMember }));
                result.success.push(updatedMember);
            } catch (error: any) {
                result.failure.push({ member: selfMember, error });
            }
        }
        return result;
    };
};

/**
 * Runs the full organization key reset. Safe to re-run after an interrupted attempt: members that were already
 * converted are simply skipped by the privatization phase and picked up again by the unprivatization phase.
 */
export const resetOrganizationKeyWithPrivatization = ({
    onStep,
}: {
    onStep?: OnResetOrganizationKeyStep;
} = {}): ThunkAction<
    Promise<RequestUnprivatizationResult>,
    ResetOrganizationKeyState,
    ProtonThunkArguments,
    UnknownAction
> => {
    return async (dispatch, _, extra) => {
        isResetRunning = true;
        try {
            onStep?.('privatize', 'running');
            const members = await dispatch(membersThunk());
            await dispatch(
                privatizeMembersForOrganizationKeyReset({
                    members: getMembersToPrivatizeForOrganizationKeyReset(members),
                })
            );
            onStep?.('privatize', 'done');

            onStep?.('rotate', 'running');
            const keyRotationPayload = await dispatch(getKeyRotationPayload({ api: getSilentApi(extra.api) }));
            await dispatch(rotatePasswordlessOrganizationKeys({ ...keyRotationPayload, mode: 'reset' }));
            onStep?.('rotate', 'done');

            onStep?.('unprivatize', 'running');
            // Refetch so that members privatized by an earlier, interrupted attempt are included too.
            const updatedMembers = await dispatch(membersThunk({ cache: CacheType.None }));
            const result = await dispatch(
                requestUnprivatizationForOrganizationKeyReset({
                    members: updatedMembers.filter(getIsMemberPendingOrgKeyResetUnprivatization),
                })
            );
            onStep?.('unprivatize', 'done');

            return result;
        } finally {
            isResetRunning = false;
        }
    };
};

/**
 * Picks the reset back up where it left off when the unprivatization requests never went out, for instance because
 * the page was refreshed while the reset was running. Driven by {@link resetOrganizationKeyListener}.
 */
export const resumeOrganizationKeyResetUnprivatization = (): ThunkAction<
    Promise<RequestUnprivatizationResult | undefined>,
    ResetOrganizationKeyState,
    ProtonThunkArguments,
    UnknownAction
> => {
    return async (dispatch) => {
        if (isResetRunning) {
            return;
        }
        // Set synchronously before the first await, otherwise a concurrent run could slip through the guard above.
        isResetRunning = true;
        try {
            const members = await dispatch(membersThunk());
            const membersToUnprivatize = members.filter(getIsMemberPendingOrgKeyResetUnprivatization);
            if (!membersToUnprivatize.length) {
                return;
            }
            // The unprivatization request is signed with the organization key, so it can only be sent once the key
            // has been reset. Otherwise the reset is still in progress and the flow itself will send the requests.
            const organizationKey = await dispatch(organizationKeyThunk());
            if (!organizationKey?.privateKey) {
                return;
            }
            return await dispatch(
                requestUnprivatizationForOrganizationKeyReset({
                    members: membersToUnprivatize,
                })
            );
        } finally {
            isResetRunning = false;
        }
    };
};
