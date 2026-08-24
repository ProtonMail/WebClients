import { createAction } from '@reduxjs/toolkit';

import type { UserSettings } from '@proton/shared/lib/interfaces';
import identity from '@proton/utils/identity';

import type { MaybeNull } from '../../../types';
import { pipe } from '../../../utils/fp/pipe';
import { UNIX_HOUR } from '../../../utils/time/constants';
import type { FeatureFlagState, FeatureFlagVariants, HydratedAccessState } from '../../reducers';
import { withRequest, withRequestFailure, withRequestSuccess } from '../../request/enhancers';
import { requestActionsFactory } from '../../request/flow';
import { withCache } from '../enhancers/cache';
import { withSettings } from '../enhancers/settings';
import { userAccessRequest, userFeaturesRequest } from '../requests';

export const getUserFeaturesIntent = createAction('user::features::get::intent', (userId: string) =>
    withRequest({ status: 'start', id: userFeaturesRequest(userId) })({ payload: {} })
);

export const setUserFeatureFlags = createAction('user::feature-flags::set', (payload: FeatureFlagState) =>
    pipe(withCache, withSettings)({ payload })
);

export const getUserFeaturesSuccess = createAction(
    'user::features::get::success',
    withRequestSuccess((payload: { features: FeatureFlagState; variants: FeatureFlagVariants }) => withCache({ payload }), {
        maxAge: UNIX_HOUR / 2,
        data: null,
    })
);

export const getUserFeaturesFailure = createAction(
    'user::features::get::failure',
    withRequestFailure((error: unknown) => ({ payload: {}, error }))
);

export const getUserAccessIntent = createAction('user::access::get::intent', (userId: string) =>
    withRequest({ status: 'start', id: userAccessRequest(userId) })({ payload: {} })
);

export const getUserAccessSuccess = createAction(
    'user::access::get::success',
    withRequestSuccess((payload: HydratedAccessState) => withCache({ payload }), { maxAge: UNIX_HOUR / 2, data: null })
);

export const getUserAccessFailure = createAction(
    'user::access::get::failure',
    withRequestFailure((error: unknown) => ({ payload: {}, error }))
);

export const getUserSettings = requestActionsFactory<string, UserSettings>('user::settings::get')({ key: identity });
export const setUserAccess = createAction<HydratedAccessState>('user::access');
export const setUserEventID = createAction('user::userEventID::set', (userEventId: MaybeNull<string>) =>
    withCache({ payload: { userEventId } })
);
