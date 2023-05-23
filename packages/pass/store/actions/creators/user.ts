import { createAction } from '@reduxjs/toolkit';

import type { PassPlanResponse } from '@proton/pass/types';

import type { UserFeatureState } from '../../reducers';

export const setUserPlan = createAction<PassPlanResponse>('set plan');
export const setUserFeatures = createAction<UserFeatureState>('set user features');
