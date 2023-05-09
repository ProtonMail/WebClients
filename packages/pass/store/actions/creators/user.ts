import { createAction } from '@reduxjs/toolkit';

import { PassPlanResponse } from '@proton/pass/types';

export const setUserPlan = createAction<PassPlanResponse>('set plan');
