import { useCallback } from 'react';

import { c } from 'ttag';

import { useApi } from '@proton/components';
import { queryPublicBookingPage } from '@proton/shared/lib/api/calendarBookings';
import { base64URLStringToUint8Array, uint8ArrayToPaddedBase64URLString } from '@proton/shared/lib/helpers/encoding';
import type { ExternalBookingPagePayload } from '@proton/shared/lib/interfaces/calendar/Bookings';

import { deriveBookingUid } from '../containers/bookings/utils/bookingCryptoUtils';
import { useBookingStore } from './booking.store';
import { decryptBookingContent } from './utils/decryptBookingContent';
import { generateWeekRangesFromDays } from './utils/generateWeekRangesFromDays';
import { transformAvailableSlotToTimeslot } from './utils/transformAvailableSlot';

export const useExternalBookingLoader = () => {
    const api = useApi();

    /**
     * The logic here is to load public booking
     * We split the request per week so max 7 days per request to prevent BE load
     * We also depend on the mini calendar view that is showing 6 week rows.
     * So we are requesting those 6 weeks. The minimum is the current date (today)
     */
    const loadPublicBooking = useCallback(
        async (bookingSecretBase64Url: string, displayedDays: Date[]) => {
            const { setBookingDetails, setTimeslots, setLoading } = useBookingStore.getState();
            const bookingSecretBytes = base64URLStringToUint8Array(bookingSecretBase64Url);
            const bookingUidBase64Url = uint8ArrayToPaddedBase64URLString(await deriveBookingUid(bookingSecretBytes));

            try {
                setLoading(true);

                const weeklyRanges = generateWeekRangesFromDays(displayedDays);

                if (weeklyRanges.length === 0) {
                    setTimeslots([]);
                    return;
                }

                const allTimeslots: ReturnType<typeof transformAvailableSlotToTimeslot>[] = [];

                let bookingPageData: ExternalBookingPagePayload | null = null;

                const BATCH_SIZE = 20;
                for (let i = 0; i < weeklyRanges.length; i += BATCH_SIZE) {
                    const batch = weeklyRanges.slice(i, i + BATCH_SIZE);
                    const batchResults = await Promise.all(
                        batch.map((range) => {
                            return api<{ BookingPage: ExternalBookingPagePayload; Code: number }>(
                                queryPublicBookingPage(bookingUidBase64Url, {
                                    startTime: range.start,
                                    endTime: range.end,
                                })
                            );
                        })
                    );

                    for (const result of batchResults) {
                        if (!bookingPageData) {
                            bookingPageData = result.BookingPage;
                        }

                        const slots = result.BookingPage.AvailableSlots;
                        allTimeslots.push(...slots.map(transformAvailableSlotToTimeslot));
                    }
                }

                if (!bookingPageData) {
                    throw new Error(c('Error').t`No booking page data received`);
                }

                const { summary, description, location } = await decryptBookingContent({
                    encryptedContent: bookingPageData.EncryptedContent,
                    bookingSecretBytes,
                    bookingKeySalt: bookingPageData.BookingKeySalt,
                    calendarId: bookingPageData.CalendarID,
                    bookingUid: bookingPageData.BookingUID,
                });

                setBookingDetails({
                    calendarId: bookingPageData.CalendarID,
                    bookingUid: bookingPageData.BookingUID,
                    summary,
                    description,
                    location,
                    duration: bookingPageData.Duration ? bookingPageData.Duration / 60 : undefined,
                    timezone: bookingPageData.Timezone ?? undefined,
                    bookingKeySalt: bookingPageData.BookingKeySalt,
                    inviterDisplayName: bookingPageData.DisplayName,
                    inviterEmail: bookingPageData.Email,
                });

                setTimeslots(allTimeslots);
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
