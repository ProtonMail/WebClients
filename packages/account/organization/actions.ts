import { type UnknownAction } from '@reduxjs/toolkit';
import { type ThunkAction } from 'redux-thunk';

import { type ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { CacheType } from '@proton/redux-utilities';
import { updateQuota } from '@proton/shared/lib/api/members';
import {
    leaveOrganisation as leaveOrganisationConfig,
    updateOrganizationName,
} from '@proton/shared/lib/api/organization';
import clamp from '@proton/utils/clamp';

import { type MemberState, memberThunk } from '../member';
import { type OrganizationState, organizationActions, organizationThunk } from '../organization/index';
import {
    type RotateOrganizationKeysState,
    createPasswordlessOrganizationKeys,
    getKeyRotationPayload,
} from '../organizationKey/actions';
import { type SubscriptionState, subscriptionThunk } from '../subscription';
import { userThunk } from '../user';
import { getInitialStorage, getStorageRange } from './storage';

export const setDefaultStorage = (): ThunkAction<
    Promise<void>,
    OrganizationState & MemberState,
    ProtonThunkArguments,
    UnknownAction
> => {
    return async (dispatch, _, extra) => {
        const [selfMember, organization] = await Promise.all([
            dispatch(memberThunk({ cache: CacheType.None })),
            dispatch(organizationThunk()),
        ]);

        const storageRange = getStorageRange(selfMember, organization);
        const initialStorage = getInitialStorage(organization, storageRange);
        const storageValue = clamp(initialStorage, storageRange.min, storageRange.max);

        await extra.api(updateQuota(selfMember.ID, storageValue));
    };
};

export const setKeys = (): ThunkAction<
    Promise<void>,
    RotateOrganizationKeysState,
    ProtonThunkArguments,
    UnknownAction
> => {
    return async (dispatch, _, extra) => {
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

export const setName = ({
    name,
}: {
    name: string;
}): ThunkAction<Promise<void>, OrganizationState & MemberState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, _, extra) => {
        const { Organization } = await extra.api(updateOrganizationName(name));
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
        await dispatch(setName({ name }));
        await dispatch(setKeys());
        await dispatch(setDefaultStorage());
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
