import { useCallback } from 'react';

import { endOfMonth, getUnixTime } from 'date-fns';

import { useApi } from '@proton/components';
import { CryptoProxy } from '@proton/crypto/lib';
import { queryPublicBookingPage } from '@proton/shared/lib/api/calendarBookings';
import {
    base64StringToUint8Array,
    base64URLStringToUint8Array,
    uint8ArrayToBase64String,
    uint8ArrayToPaddedBase64URLString,
} from '@proton/shared/lib/helpers/encoding';
import type { ExternalBookingPagePayload } from '@proton/shared/lib/interfaces/calendar/Bookings';

import { deriveBookingKeyPassword, deriveBookingUid } from '../containers/bookings/bookingCryptoUtils';
import { useBookingStore } from './booking.store';

export const usePublicBookingLoader = () => {
    const api = useApi();

    const loadPublicBooking = useCallback(
        async (bookingSecretBase64Url: string) => {
            const { setBookingDetails, setTimeslots, setLoading } = useBookingStore.getState();
            const secretBytes = base64URLStringToUint8Array(bookingSecretBase64Url);
            const bookingUid = uint8ArrayToPaddedBase64URLString(await deriveBookingUid(secretBytes));
            try {
                setLoading(true);

                const now = new Date();
                const result = await api<{ BookingPage: ExternalBookingPagePayload; Code: number }>(
                    // TODO: Use better helper for that
                    queryPublicBookingPage(bookingUid, {
                        startTime: getUnixTime(now),
                        endTime: getUnixTime(endOfMonth(now)),
                    })
                );

                const salt = base64StringToUint8Array(result.BookingPage.BookingKeySalt);
                const bookingKeyPassword = uint8ArrayToBase64String(
                    await deriveBookingKeyPassword(result.BookingPage.CalendarID, secretBytes, salt)
                );

                const decryptedContent = await CryptoProxy.decryptMessage({
                    binaryMessage: base64StringToUint8Array(result.BookingPage.EncryptedContent),
                    passwords: [bookingKeyPassword],
                }).then((result) => result.data);
                const { summary, description, location }: { summary: string; description: string; location: string } =
                    JSON.parse(decryptedContent);
                setBookingDetails({
                    bookingUid: result.BookingPage.BookingUID,
                    summary,
                    description,
                    location,
                    duration: result.BookingPage.Duration ? result.BookingPage.Duration / 60 : undefined,
                    timezone: result.BookingPage.Timezone ?? undefined,
                });

                setTimeslots(
                    result.BookingPage.AvailableSlots.map((availableSlot) => ({
                        id: availableSlot.ID,
                        startTime: availableSlot.StartTime,
                        endTime: availableSlot.EndTime,
                        timezone: availableSlot.Timezone,
                        rrule: availableSlot.RRule ? availableSlot.RRule : undefined,
                    }))
                );
            } catch (error) {
                throw error;
            } finally {
                setLoading(false);
            }
        },
        [api]
    );

    return { loadPublicBooking };
};
