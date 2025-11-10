import type { UnauthenticatedApi } from '@proton/shared/lib/unauthApi/unAuthenticatedApi';

import type { BookingsStore } from '../../store/bookingsStore';

export interface BookingBootstrapResult {
    store: BookingsStore;
}

export interface BookingGuestBootstrapResult extends BookingBootstrapResult {
    unauthenticatedApi: UnauthenticatedApi;
}
