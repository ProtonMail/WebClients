import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { deleteGroupMember } from '@proton/shared/lib/api/groups';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import type { GroupMembership } from '@proton/shared/lib/interfaces';

import { type AddressesState } from '../addresses';
import { declineOrLeaveMembership } from '../groupMemberships';
import type { KtState } from '../kt';
import { type OrganizationKeyState } from '../organizationKey';
import { type UserKeysState } from '../userKeys';

type RequiredState = AddressesState & UserKeysState & OrganizationKeyState & KtState;

export const declineGroupInvitation = ({
    membership,
}: {
    membership: GroupMembership;
}): ThunkAction<Promise<void>, RequiredState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, _, extra) => {
        const api = getSilentApi(extra.api);

        await api(deleteGroupMember(membership.ID));
        dispatch(declineOrLeaveMembership(membership));
    };
};
