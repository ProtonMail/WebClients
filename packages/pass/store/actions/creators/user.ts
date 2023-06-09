import { createAction } from '@reduxjs/toolkit';

import type { UserFeatureState, UserPlanState } from '../../reducers';

export const setUserPlan = createAction<UserPlanState>('set plan');
export const setUserFeatures = createAction<UserFeatureState>('set user features');
