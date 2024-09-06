import { createHooks } from '@proton/redux-utilities';

import { paymentStatusThunk, selectPaymentStatus } from './index';

const hooks = createHooks(paymentStatusThunk, selectPaymentStatus);

export const usePaymentStatus = hooks.useValue;
export const useGetPaymentStatus = hooks.useGet;
