export const bookingSlotSignatureValue = (bookingID: string) => `bookings.slot.${bookingID}`;
export const bookingContentSignatureValue = (bookingID: string) => `bookings.content.${bookingID}`;
export const bookingSecretSignatureValue = (calendarID: string) => `bookings.secret.${calendarID}`;
