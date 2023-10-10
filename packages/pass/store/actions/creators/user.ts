import { createAction } from '@reduxjs/toolkit';

import type { FeatureFlagState, UserPlanState } from '../../reducers';

export const setUserPlan = createAction<UserPlanState>('user::plan::set');
export const setUserFeatures = createAction<FeatureFlagState>('user::features::set');
