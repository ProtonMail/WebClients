import { createAction } from '@reduxjs/toolkit';

import withCacheBlock from '@proton/pass/store/actions/with-cache-block';
import withRequest, { withRequestFailure, withRequestSuccess } from '@proton/pass/store/actions/with-request';
import type { FeatureFlagState, SafeUserAccessState } from '@proton/pass/store/reducers';
import { pipe } from '@proton/pass/utils/fp/pipe';
import { UNIX_HOUR } from '@proton/pass/utils/time/constants';

import { userAccessRequest, userFeaturesRequest } from '../requests';

export const getUserFeaturesIntent = createAction('user::features::get::intent', (userId: string) =>
    pipe(withRequest({ type: 'start', id: userFeaturesRequest(userId) }), withCacheBlock)({ payload: {} })
);

export const getUserFeaturesSuccess = createAction(
    'user::features::get::success',
    withRequestSuccess((payload: FeatureFlagState) => ({ payload }), { maxAge: UNIX_HOUR / 2 })
);

export const getUserFeaturesFailure = createAction(
    'user::features::get::failure',
    withRequestFailure((error: unknown) => withCacheBlock({ payload: {}, error }))
);

export const getUserAccessIntent = createAction('user::access::get::intent', (userId: string) =>
    pipe(withRequest({ type: 'start', id: userAccessRequest(userId) }), withCacheBlock)({ payload: {} })
);

export const getUserAccessSuccess = createAction(
    'user::access::get::success',
    withRequestSuccess((payload: SafeUserAccessState) => ({ payload }), { maxAge: UNIX_HOUR / 2 })
);

export const getUserAccessFailure = createAction(
    'user::access::get::failure',
    withRequestFailure((error: unknown) => withCacheBlock({ payload: {}, error }))
);
