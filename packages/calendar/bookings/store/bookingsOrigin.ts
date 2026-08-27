import { getAppHref } from '@proton/shared/lib/apps/helper';
import { APPS } from '@proton/shared/lib/constants';

/**
 * Booking links must always point at the Calendar app, which hosts the public booking page.
 * The consuming app cannot be assumed to be Calendar: Mail dispatches these thunks too, and
 * using window.location.origin there would produce links pointing at the Mail host.
 */
export const getBookingsOrigin = () => {
    return new URL(getAppHref('/bookings', APPS.PROTONCALENDAR)).origin;
};
