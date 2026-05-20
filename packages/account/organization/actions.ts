import type { UnknownAction } from '@reduxjs/toolkit';
import type { ThunkAction } from 'redux-thunk';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { CacheType } from '@proton/redux-utilities/interface';
import { updateVPN } from '@proton/shared/lib/api/members';
import {
    leaveOrganisation as leaveOrganisationConfig,
    updateOrganizationName as updateOrganizationNameConfig,
} from '@proton/shared/lib/api/organization';
import { VPN_CONNECTIONS } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

import type { MemberState } from '../member';
import { type MembersState, membersThunk } from '../members';
import { type OrganizationState, organizationActions, organizationThunk } from '../organization/index';
import {
    type RotateOrganizationKeysState,
    createPasswordlessOrganizationKeys,
    getKeyRotationPayload,
} from '../organizationKey/actions';
import { type SubscriptionState, subscriptionThunk } from '../subscription';
import { userThunk } from '../user';

export const setupAdminVpnConnections = (): ThunkAction<
    Promise<void>,
    MembersState,
    ProtonThunkArguments,
    UnknownAction
> => {
    return async (dispatch, _, extra) => {
        const [user, members] = await Promise.all([dispatch(userThunk()), dispatch(membersThunk())]);
        const selfMember = members.find(({ Self }) => !!Self);
        if (!selfMember?.ID) {
            throw new Error('Missing member id');
        }
        if (user.hasPaidVpn && selfMember.MaxVPN !== VPN_CONNECTIONS) {
            await extra.api(updateVPN(selfMember.ID, VPN_CONNECTIONS)).catch(noop);
        }
    };
};

export const setKeys = (): ThunkAction<
    Promise<void>,
    RotateOrganizationKeysState,
    ProtonThunkArguments,
    UnknownAction
> => {
    return async (dispatch, _, extra) => {
        const organization = await dispatch(organizationThunk());
        if (organization.HasKeys) {
            return;
        }
        const result = await dispatch(
            getKeyRotationPayload({
                api: extra.api,
                ignorePasswordlessValidation: true,
            })
        );

        await extra.api(await dispatch(createPasswordlessOrganizationKeys(result)));
        await dispatch(organizationActions.update({ Organization: { HasKeys: 1 } }));
    };
};

/** Calls the API and updates the local state. */
export const updateOrganizationName = ({
    name,
}: {
    name: string;
}): ThunkAction<Promise<void>, OrganizationState & MemberState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, _, extra) => {
        const { Organization } = await extra.api(updateOrganizationNameConfig(name));
        await dispatch(organizationActions.update({ Organization }));
    };
};

export const initOrganization = ({
    name,
}: {
    name: string;
}): ThunkAction<
    Promise<void>,
    OrganizationState & MemberState & RotateOrganizationKeysState,
    ProtonThunkArguments,
    UnknownAction
> => {
    return async (dispatch) => {
        await dispatch(updateOrganizationName({ name }));
        await dispatch(setKeys());
    };
};

export const leaveOrganization = (): ThunkAction<
    Promise<void>,
    OrganizationState & SubscriptionState & MemberState & RotateOrganizationKeysState,
    ProtonThunkArguments,
    UnknownAction
> => {
    return async (dispatch, getState, extra) => {
        await extra.api(leaveOrganisationConfig());
        await Promise.all([
            dispatch(userThunk({ cache: CacheType.None })),
            dispatch(organizationThunk({ cache: CacheType.None })),
            dispatch(subscriptionThunk({ cache: CacheType.None })),
        ]);
    };
};
