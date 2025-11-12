import { createHooks } from '@proton/redux-utilities';

import { internalBookingThunk, selectInternalBooking } from './interalBookingSlice';

const hooks = createHooks(internalBookingThunk, selectInternalBooking);

export const useInternalBooking = hooks.useValue;
export const useGetInternalBooking = hooks.useGet;
