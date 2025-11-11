import { useLocation } from 'react-router';

import { isAfter } from 'date-fns';
import { c } from 'ttag';

import { useApi } from '@proton/components';
import { queryPublicBookingPage } from '@proton/shared/lib/api/calendarBookings';
import { base64URLStringToUint8Array, uint8ArrayToPaddedBase64URLString } from '@proton/shared/lib/helpers/encoding';
import type { ExternalBookingPagePayload } from '@proton/shared/lib/interfaces/calendar/Bookings';

import { deriveBookingUid } from '../containers/bookings/utils/bookingCryptoUtils';
import { useBookingStore } from './booking.store';
import { decryptBookingContent } from './utils/decryptBookingContent';
import { generateWeeklyRangeSimple } from './utils/generateWeekRangesFromDays';
import { transformAvailableSlotToTimeslot } from './utils/transformAvailableSlot';

export const useExternalBookingLoader = () => {
    const api = useApi();
    const location = useLocation();
    const bookingSecretBase64Url = location.hash.substring(1);

    const setLoading = useBookingStore((state) => state.setLoading);
    const setBookingDetails = useBookingStore((state) => state.setBookingDetails);
    const setTimeslots = useBookingStore((state) => state.setTimeslots);

    /**
     * The logic here is to load public booking
     * We split the request per week so max 7 days per request to prevent BE load
     * We also depend on the mini calendar view that is showing 6 week rows.
     * So we are requesting those 6 weeks. The minimum is the current date (today)
     */
    const loadPublicBooking = async (rangeStartDate: Date) => {
        if (!bookingSecretBase64Url) {
            setLoading(false);
            return;
        }

        const bookingSecretBytes = base64URLStringToUint8Array(bookingSecretBase64Url);
        const bookingUidBase64Url = uint8ArrayToPaddedBase64URLString(await deriveBookingUid(bookingSecretBytes));

        const rangeStart = isAfter(rangeStartDate, new Date()) ? rangeStartDate : new Date();
        const weekRangeSimple = generateWeeklyRangeSimple(rangeStart);

        try {
            setLoading(true);

            const allTimeslots: ReturnType<typeof transformAvailableSlotToTimeslot>[] = [];

            let bookingPageData: ExternalBookingPagePayload | null = null;

            const rangePromise = [];
            // Fetch all the ranges that are visible in the calendar
            for (const range of weekRangeSimple) {
                rangePromise.push(
                    api<{ BookingPage: ExternalBookingPagePayload; Code: number }>(
                        queryPublicBookingPage(bookingUidBase64Url, {
                            startTime: range.start,
                            endTime: range.end,
                        })
                    )
                );
            }

            const results = await Promise.all(rangePromise);

            for (const result of results) {
                if (!bookingPageData) {
                    bookingPageData = result.BookingPage;
                }

                const slots = result.BookingPage.AvailableSlots;
                allTimeslots.push(...slots.map(transformAvailableSlotToTimeslot));
            }

            if (!bookingPageData) {
                throw new Error(c('Error').t`No booking page data received`);
            }

            const { summary, description, location, withProtonMeetLink } = await decryptBookingContent({
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
                withProtonMeetLink,
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
    };

    return { loadPublicBooking };
};
