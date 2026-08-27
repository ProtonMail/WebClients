import { createHooks } from '@proton/redux-utilities/hooks';

import { internalBookingThunk, selectInternalBooking } from './internalBookingSlice';

const hooks = createHooks(internalBookingThunk, selectInternalBooking);

export const useInternalBooking = hooks.useValue;
export const useGetInternalBooking = hooks.useGet;
