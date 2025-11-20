export const bookingSlotSignatureContextValue = (bookingID: string) => `bookings.slot.${bookingID}`;
export const bookingContentSignatureContextValue = (bookingID: string) => `bookings.content.${bookingID}`;
export const bookingSecretSignatureContextValue = (calendarID: string) => `bookings.secret.${calendarID}`;
