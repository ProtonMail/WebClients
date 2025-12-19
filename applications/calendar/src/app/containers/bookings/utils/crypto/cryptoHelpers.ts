export const bookingSlotSignatureContextValue = (bookingUID: string) => `bookings.slot.${bookingUID}`;
export const bookingContentSignatureContextValue = (bookingUID: string) => `bookings.content.${bookingUID}`;
export const bookingCalendarKeySignatureContextValue = (bookingUID: string) => `bookings.calendarKey.${bookingUID}`;
export const bookingSecretSignatureContextValue = (calendarID: string) => `bookings.secret.${calendarID}`;
