import { createHooks } from '@proton/redux-utilities/hooks';

import { paymentsInitThunk, selectPaymentsInit } from './index';

const hooks = createHooks(paymentsInitThunk, selectPaymentsInit);

export const usePaymentsInit = hooks.useValue;
export const useGetPaymentsInit = hooks.useGet;
