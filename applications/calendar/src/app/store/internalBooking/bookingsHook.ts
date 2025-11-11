import { createHooks } from '@proton/redux-utilities';

import { internalBookingThunk, selectInternalBooking } from './interalBookingSlice';
import type { InternalBookingPageSliceInterface } from './interface';

const hooks = createHooks(internalBookingThunk, selectInternalBooking);

export const useInternalBooking = hooks.useValue as unknown as () => [InternalBookingPageSliceInterface, boolean];
export const useGetInternalBooking = hooks.useGet;
