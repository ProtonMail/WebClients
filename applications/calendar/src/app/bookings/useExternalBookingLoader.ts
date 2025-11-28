import { useLocation } from 'react-router';

import { endOfDay, getUnixTime, isAfter } from 'date-fns';
import { c } from 'ttag';

import { useGetUser } from '@proton/account/user/hooks';
import { useApi, useGetVerificationPreferences } from '@proton/components';
import { getNextAvailableSlot, queryPublicBookingPage } from '@proton/shared/lib/api/calendarBookings';
import type {
    ExternalBookingPagePayload,
    ExternalBookingPageSlotsPayload,
} from '@proton/shared/lib/interfaces/calendar/Bookings';
import { useFlag } from '@proton/unleash';

import { decryptBookingContent } from '../containers/bookings/utils/crypto/bookingDecryption';
import { deriveBookingUid } from '../containers/bookings/utils/crypto/bookingEncryption';
import { useBookingStore } from './booking.store';
import { generateWeeklyRangeSimple, transformAvailableSlotToTimeslot } from './utils/bookingsHelpers';

export const useExternalBookingLoader = () => {
    const api = useApi();
    const location = useLocation();
    const bookingSecretBase64Url = location.hash.substring(1);
    const isMeetVideoConferenceEnabled = useFlag('NewScheduleOption');

    const getUser = useGetUser();
    const getVerificationPreferences = useGetVerificationPreferences();

    const setLoading = useBookingStore((state) => state.setLoading);
    const setBookingDetails = useBookingStore((state) => state.setBookingDetails);
    const setBookingSlots = useBookingStore((state) => state.setBookingSlots);
    const setNextAvailableSlot = useBookingStore((state) => state.setNextAvailableSlot);
    const setFailedToVerify = useBookingStore((state) => state.setFailedToVerify);

    /**
     * The logic here is to load public booking
     * We split the request per week so max 7 days per request to prevent BE load
     * We also depend on the mini calendar view that is showing 6 week rows.
     * So we are requesting those 6 weeks. The minimum is the current date (today)
     */
    const loadPublicBooking = async (rangeStartDate: Date, rangeEndDate?: Date) => {
        if (!bookingSecretBase64Url) {
            setLoading(false);
            return;
        }

        const bookingSecretBytes = Uint8Array.fromBase64(bookingSecretBase64Url, { alphabet: 'base64url' });
        const bookingUidBase64Url = (await deriveBookingUid(bookingSecretBytes)).toBase64({ alphabet: 'base64url' });

        const rangeStart = isAfter(rangeStartDate, new Date()) ? rangeStartDate : new Date();
        const weekRangeSimple = rangeEndDate
            ? generateWeeklyRangeSimple(rangeStart, rangeEndDate)
            : generateWeeklyRangeSimple(rangeStart);

        try {
            setLoading(true);

            const allBookingSlot: ReturnType<typeof transformAvailableSlotToTimeslot>[] = [];

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

            const nextSlotStartTime = getUnixTime(endOfDay(rangeEndDate || rangeStart));
            const nextAvailableSlotPromise = api<{ NextSlot: ExternalBookingPageSlotsPayload }>(
                getNextAvailableSlot(bookingUidBase64Url, nextSlotStartTime)
            );
            const [results, nextAvailableSlotResult] = await Promise.all([
                Promise.all(rangePromise),
                nextAvailableSlotPromise,
            ]);

            for (const result of results) {
                if (!bookingPageData) {
                    bookingPageData = result.BookingPage;
                }

                const slots = result.BookingPage.AvailableSlots;
                allBookingSlot.push(...slots.map(transformAvailableSlotToTimeslot));
            }

            if (!bookingPageData) {
                throw new Error(c('Error').t`No booking page data received`);
            }

            let verificationPreferences = null;

            try {
                // This will throw if the user is a guest
                const user = await getUser();
                if (user) {
                    verificationPreferences = await getVerificationPreferences({
                        email: bookingPageData.Email,
                        lifetime: 0,
                    });
                }
            } catch (e) {}

            const { summary, description, location, withProtonMeetLink, failedToVerify } = await decryptBookingContent({
                encryptedContent: bookingPageData.EncryptedContent,
                bookingSecretBytes,
                bookingKeySalt: bookingPageData.BookingKeySalt,
                calendarId: bookingPageData.CalendarID,
                bookingUid: bookingPageData.BookingUID,
                verificationPreferences,
            });

            setBookingDetails({
                calendarId: bookingPageData.CalendarID,
                bookingUid: bookingPageData.BookingUID,
                summary,
                description,
                location,
                withProtonMeetLink: isMeetVideoConferenceEnabled ? withProtonMeetLink : false,
                duration: bookingPageData.Duration ? bookingPageData.Duration / 60 : undefined,
                timezone: bookingPageData.Timezone ?? undefined,
                bookingKeySalt: bookingPageData.BookingKeySalt,
                inviterDisplayName: bookingPageData.DisplayName,
                inviterEmail: bookingPageData.Email,
            });

            setFailedToVerify(failedToVerify);
            setBookingSlots(allBookingSlot);

            if (nextAvailableSlotResult.NextSlot) {
                setNextAvailableSlot(transformAvailableSlotToTimeslot(nextAvailableSlotResult.NextSlot));
            } else {
                setNextAvailableSlot(null);
            }
        } catch (error) {
            throw error;
        } finally {
            setLoading(false);
        }
    };

    return { loadPublicBooking };
};
