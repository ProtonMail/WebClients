import { createAction } from '@reduxjs/toolkit';

import withCacheBlock from '@proton/pass/store/actions/with-cache-block';
import { withRequestFailure, withRequestStart, withRequestSuccess } from '@proton/pass/store/actions/with-request';
import type { FeatureFlagState, UserPlanState } from '@proton/pass/store/reducers';
import { UNIX_DAY, UNIX_HOUR } from '@proton/pass/utils/time/constants';

export const getUserFeaturesIntent = createAction(
    'user::features::get::intent',
    withRequestStart(() => withCacheBlock({ payload: {} }))
);

export const getUserFeaturesSuccess = createAction(
    'user::features::get::success',
    withRequestSuccess((payload: FeatureFlagState) => ({ payload }), { maxAge: UNIX_HOUR })
);

export const getUserFeaturesFailure = createAction(
    'user::features::get::failure',
    withRequestFailure((error: unknown) => withCacheBlock({ payload: {}, error }))
);

export const getUserPlanIntent = createAction(
    'user::plan::get::intent',
    withRequestStart(() => withCacheBlock({ payload: {} }))
);

export const getUserPlanSuccess = createAction(
    'user::plan::get::success',
    withRequestSuccess((payload: UserPlanState) => ({ payload }), { maxAge: UNIX_DAY })
);

export const getUserPlanFailure = createAction(
    'user::plan::get::failure',
    withRequestFailure((error: unknown) => withCacheBlock({ payload: {}, error }))
);
