import { createAction } from '@reduxjs/toolkit';

import type { FeatureFlagState, UserPlanState, UserSettingsState } from '@proton/pass/store/reducers';

export const setUserPlan = createAction<UserPlanState>('user::plan::set');
export const setUserFeatures = createAction<FeatureFlagState>('user::features::set');
export const setUserSettings = createAction<UserSettingsState>('user::set::settings');
