import type { UnknownAction } from '@reduxjs/toolkit';
import type { ThunkAction } from 'redux-thunk';

import { editMember, resetSelfVpnConnectionsHelper } from '@proton/account/members/actions.ts';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { CacheType } from '@proton/redux-utilities/interface';
import {
    leaveOrganisation as leaveOrganisationConfig,
    updateOrganizationName as updateOrganizationNameConfig,
} from '@proton/shared/lib/api/organization';
import noop from '@proton/utils/noop';

import type { MemberState } from '../member';
import { membersThunk } from '../members';
import { type OrganizationState, organizationActions, organizationThunk } from '../organization/index';
import {
    type RotateOrganizationKeysState,
    createPasswordlessOrganizationKeys,
    getKeyRotationPayload,
} from '../organizationKey/actions';
import { type SubscriptionState, subscriptionThunk } from '../subscription';
import { userThunk } from '../user';

export const resetSelfVpnConnections = (): ThunkAction<
    Promise<void>,
    RotateOrganizationKeysState,
    ProtonThunkArguments,
    UnknownAction
> => {
    return async (dispatch, _, extra) => {
        const [organization, members] = await Promise.all([dispatch(organizationThunk()), dispatch(membersThunk())]);
        await resetSelfVpnConnectionsHelper({ api: extra.api, members, organization }).catch(noop);
    };
};

export const setSelfQuota = (
    quota: number
): ThunkAction<
    Promise<void>,
    OrganizationState & MemberState & RotateOrganizationKeysState,
    ProtonThunkArguments,
    UnknownAction
> => {
    return async (dispatch, _, extra) => {
        const members = await dispatch(membersThunk());
        const selfMember = members.find(({ Self }) => !!Self);
        if (!selfMember?.ID) {
            throw new Error('Missing self member id');
        }
        await dispatch(
            editMember({
                member: selfMember,
                memberDiff: {
                    storage: quota,
                },
                memberKeyPacketPayload: null,
                api: extra.api,
            })
        );
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
        await dispatch(createPasswordlessOrganizationKeys(result));
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
        dispatch(organizationActions.update({ Organization }));
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
        await dispatch(resetSelfVpnConnections());
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
