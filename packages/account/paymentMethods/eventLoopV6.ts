import type { CoreEventLoopV6Callback } from '../coreEventLoop/interface';
import { paymentMethodsEventLoopV6Thunk, selectPaymentMethods } from './index';

export const paymentMethodsLoop: CoreEventLoopV6Callback = ({ event, state, dispatch, api }) => {
    if (event.PaymentsMethods?.length && selectPaymentMethods(state)?.value) {
        return dispatch(paymentMethodsEventLoopV6Thunk({ event, api }));
    }
};
