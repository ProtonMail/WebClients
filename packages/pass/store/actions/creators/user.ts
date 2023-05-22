import { createAction } from '@reduxjs/toolkit';

import type { PassPlanResponse } from '@proton/pass/types';

export const setUserPlan = createAction<PassPlanResponse>('set plan');
