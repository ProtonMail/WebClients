import { createHooks } from '@proton/redux-utilities/hooks';

import { paymentMethodsThunk, selectPaymentMethods } from './index';

const hooks = createHooks(paymentMethodsThunk, selectPaymentMethods);

export const usePaymentMethods = hooks.useValue;
export const useGetPaymentMethods = hooks.useGet;
