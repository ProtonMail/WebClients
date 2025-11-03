import type { ExternalBookingPagePayload } from '@proton/shared/lib/interfaces/calendar/Bookings';

import type { BookingTimeslot } from '../booking.store';

/**
 * Transforms an available slot from the external booking page API payload
 * into the internal BookingTimeslot format used by the booking store.
 *
 * @param availableSlot - Available slot data from the API response
 * @returns Transformed timeslot object compatible with the booking store
 *
 * @example
 * const timeslot = transformAvailableSlotToTimeslot({
 *   ID: 'slot_123',
 *   StartTime: 1737216000,
 *   EndTime: 1737219600,
 *   Timezone: 'America/New_York',
 *   RRule: 'FREQ=WEEKLY;BYDAY=MO',
 *   BookingKeyPacket: 'encrypted_key...'
 * });
 */
export const transformAvailableSlotToTimeslot = (
    availableSlot: ExternalBookingPagePayload['AvailableSlots'][number]
): BookingTimeslot => ({
    id: availableSlot.ID,
    startTime: availableSlot.StartTime,
    endTime: availableSlot.EndTime,
    timezone: availableSlot.Timezone,
    rrule: availableSlot.RRule ? availableSlot.RRule : undefined,
    bookingKeyPacket: availableSlot.BookingKeyPacket,
    detachedSignature: availableSlot.DetachedSignature,
});
