import { createAction } from '@reduxjs/toolkit';

import withCacheBlock from '@proton/pass/store/actions/with-cache-block';
import { withRequestFailure, withRequestStart, withRequestSuccess } from '@proton/pass/store/actions/with-request';
import type { FeatureFlagState, SafeUserAccessState } from '@proton/pass/store/reducers';
import { UNIX_HOUR } from '@proton/pass/utils/time/constants';

export const getUserFeaturesIntent = createAction(
    'user::features::get::intent',
    withRequestStart(() => withCacheBlock({ payload: {} }))
);

export const getUserFeaturesSuccess = createAction(
    'user::features::get::success',
    withRequestSuccess((payload: FeatureFlagState) => ({ payload }), { maxAge: UNIX_HOUR / 2 })
);

export const getUserFeaturesFailure = createAction(
    'user::features::get::failure',
    withRequestFailure((error: unknown) => withCacheBlock({ payload: {}, error }))
);

export const getUserAccessIntent = createAction(
    'user::access::get::intent',
    withRequestStart(() => withCacheBlock({ payload: {} }))
);

export const getUserAccessSuccess = createAction(
    'user::access::get::success',
    withRequestSuccess((payload: SafeUserAccessState) => ({ payload }), { maxAge: UNIX_HOUR / 2 })
);

export const getUserAccessFailure = createAction(
    'user::access::get::failure',
    withRequestFailure((error: unknown) => withCacheBlock({ payload: {}, error }))
);
