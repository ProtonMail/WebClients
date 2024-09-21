import type { UnknownAction } from '@reduxjs/toolkit';
import { createNextState, createSelector } from '@reduxjs/toolkit';
import type { ThunkAction } from 'redux-thunk';
import { c } from 'ttag';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { getApiErrorMessage } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { unprivatizeMemberKeysRoute } from '@proton/shared/lib/api/members';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';
import type {
    Api,
    EnhancedMember,
    Member,
    MemberReadyForUnprivatization,
    VerifyOutboundPublicKeys,
} from '@proton/shared/lib/interfaces';
import { getMemberReadyForUnprivatization, getSentryError, unprivatizeMember } from '@proton/shared/lib/keys';

import type { OrganizationKeyState } from '../organizationKey';
import { organizationKeyThunk } from '../organizationKey';
import { getMember } from './actions';
import { type UnprivatizationMemberFailure, upsertMember } from './index';
import { type MembersState, selectMembers, setUnprivatizationState } from './index';
import { getMemberAddresses, membersThunk } from './index';

export const getMemberToUnprivatize = (member: Member): member is MemberReadyForUnprivatization => {
    return getMemberReadyForUnprivatization(member.Unprivatization);
};

export const selectUnprivatizationState = (state: MembersState) => state.members.unprivatization;

export const selectFilteredUnprivatizationState = createSelector(
    [selectUnprivatizationState, selectMembers],
    (unprivatizationState, membersState) => {
        const membersList = Object.entries(unprivatizationState.members).map(([key, value]) => {
            return {
                id: key,
                value,
            };
        });
        let membersMap: { [key: string]: Member } = {};
        if (membersList.length > 0 && membersState.value) {
            membersMap = Object.fromEntries(membersState.value.map((member) => [member.ID, member]));
        }
        const result = membersList
            .filter((failure) => membersMap[failure.id])
            .map(({ id, value }) => {
                return {
                    member: membersMap[id],
                    value,
                };
            });
        const failures = result.filter(
            (
                result
            ): result is {
                member: Member;
                value: UnprivatizationMemberFailure;
            } => Boolean(result.value && result.value.type === 'error')
        );
        return { failures };
    }
);

const unprivatizeMembersHelper = ({
    verifyOutboundPublicKeys,
    api: normalApi,
}: {
    api: Api;
    verifyOutboundPublicKeys: VerifyOutboundPublicKeys;
}): ThunkAction<
    Promise<{
        membersToUpdate: Member[];
        membersToDelete: string[];
        membersToError: { member: Member; error: any }[];
    }>,
    MembersState & OrganizationKeyState,
    ProtonThunkArguments,
    UnknownAction
> => {
    return async (dispatch, getState, extra) => {
        const membersToDelete: string[] = [];
        const membersToUpdate: Member[] = [];
        const membersToError: { member: Member; error: string }[] = [];

        const [members, organizationKey] = await Promise.all([
            dispatch(membersThunk()),
            dispatch(organizationKeyThunk()),
        ]);

        // Ensure the organization key is active
        if (!organizationKey?.privateKey) {
            return { membersToUpdate, membersToDelete, membersToError };
        }

        const membersToUnprivatize: (EnhancedMember & MemberReadyForUnprivatization)[] = [];
        const oldState = selectUnprivatizationState(getState());
        members.forEach((member) => {
            const item = oldState.members[member.ID];
            if (getMemberToUnprivatize(member)) {
                if (!item) {
                    membersToUnprivatize.push(member);
                }
                // If there is a previous error and the user is no longer to unprivatize, delete it
            } else if (item && item.type === 'error') {
                membersToDelete.push(member.ID);
            }
        });

        if (!membersToUnprivatize.length) {
            return { membersToUpdate, membersToDelete, membersToError };
        }

        extra.eventManager.stop();
        const api = getSilentApi(normalApi);
        for (const member of membersToUnprivatize) {
            try {
                const [organizationKey, memberAddresses] = await Promise.all([
                    dispatch(organizationKeyThunk()), // Fetch org key again to ensure it's up-to-date.
                    dispatch(getMemberAddresses({ member, retry: true })),
                ]);
                const payload = await unprivatizeMember({
                    api,
                    member,
                    memberAddresses,
                    organizationKey: organizationKey.privateKey,
                    verifyOutboundPublicKeys,
                });
                await api(unprivatizeMemberKeysRoute(member.ID, payload));
                const newMember = await getMember(api, member.ID);
                membersToUpdate.push(newMember);
            } catch (error: any) {
                membersToError.push({ member, error });
            }
        }
        extra.eventManager.start();

        return { membersToUpdate, membersToDelete, membersToError };
    };
};

let running = false;
export const unprivatizeMembers = ({
    verifyOutboundPublicKeys,
    api,
}: {
    api: Api;
    verifyOutboundPublicKeys: VerifyOutboundPublicKeys;
}): ThunkAction<Promise<void>, MembersState & OrganizationKeyState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, getState) => {
        // Ensure it's only running once at a time
        if (running) {
            return;
        }

        running = true;

        const { membersToUpdate, membersToDelete, membersToError } = await dispatch(
            unprivatizeMembersHelper({
                verifyOutboundPublicKeys,
                api,
            })
        );

        running = false;

        if (!membersToUpdate.length && !membersToDelete.length && !membersToError.length) {
            return;
        }

        membersToError.forEach(({ error }) => {
            const sentryError = getSentryError(error);
            if (sentryError) {
                captureMessage('Unprivatization: Error unprivatizing member', {
                    level: 'error',
                    extra: { error: sentryError },
                });
            }
        });

        const oldState = selectUnprivatizationState(getState());
        const newState = createNextState(oldState, (state) => {
            membersToUpdate.forEach((member) => {
                state.members[member.ID] = { type: 'success' };
            });

            membersToDelete.forEach((memberID) => {
                delete state.members[memberID];
            });

            membersToError.forEach(({ member, error }) => {
                const apiErrorMessage = getApiErrorMessage(error);
                const errorMessage = apiErrorMessage || error?.message || c('Error').t`Unknown error`;
                state.members[member.ID] = { type: 'error', error: errorMessage };
            });
        });

        if (newState !== oldState) {
            dispatch(setUnprivatizationState(newState));
        }
        membersToUpdate.forEach((member) => {
            dispatch(upsertMember({ member }));
        });
    };
};
