import { useLocation } from 'react-router';

import { endOfDay, getUnixTime, isAfter } from 'date-fns';
import { c } from 'ttag';

import { shouldCheckSignatureVerificationStatus } from '@proton/account/publicKeys/verificationPreferences';
import { useGetUser } from '@proton/account/user/hooks';
import useGetVerificationPreferences from '@proton/components/hooks/useGetVerificationPreferences';
import { useSilentApi } from '@proton/components/hooks/useSilentApi';
import { CryptoProxy, VERIFICATION_STATUS } from '@proton/crypto';
import { getNextAvailableSlot, queryPublicBookingPage } from '@proton/shared/lib/api/calendarBookings';
import { SentryCalendarInitiatives, traceInitiativeError } from '@proton/shared/lib/helpers/sentry';
import type { Api, User } from '@proton/shared/lib/interfaces';
import type {
    ExternalBookingPagePayload,
    ExternalBookingPageSlotsPayload,
} from '@proton/shared/lib/interfaces/calendar/Bookings';
import type { GetVerificationPreferences } from '@proton/shared/lib/interfaces/hooks/GetVerificationPreferences';

import { decryptBookingContent } from '../containers/bookings/utils/crypto/bookingDecryption';
import { deriveBookingUid } from '../containers/bookings/utils/crypto/bookingEncryption';
import { bookingCalendarKeySignatureContextValue } from '../containers/bookings/utils/crypto/cryptoHelpers';
import { type BookingTimeslot, useBookingStore } from './booking.store';
import { generateWeeklyRangeSimple, transformAvailableSlotToTimeslot } from './utils/bookingsHelpers';

const fetchVerificationKeys = async (
    getUser: () => Promise<User>,
    getVerificationPreferences: GetVerificationPreferences,
    userEmail: string
) => {
    try {
        // This will throw if the user is a guest
        const user = await getUser();
        if (user) {
            const verificationPreferences = await getVerificationPreferences({
                email: userEmail,
                lifetime: 0,
            });

            return verificationPreferences;
        }
        return null;
    } catch (e) {
        return null;
    }
};

const fetchBookingRanges = async ({
    api,
    bookingUidBase64Url,
    weekRangeSimple,
    loadedRanges,
}: {
    api: Api;
    bookingUidBase64Url: string;
    weekRangeSimple: { start: number; end: number }[];
    loadedRanges: { start: number; end: number }[];
}) => {
    const rangePromise = [];
    const newRanges: { start: number; end: number }[] = [];

    for (const range of weekRangeSimple) {
        // Do not load ranges already fetched
        const rangeAlreadyLoaded = loadedRanges.find(({ start, end }) => {
            return start >= range.start && end <= range.end;
        });
        if (rangeAlreadyLoaded) {
            continue;
        }

        rangePromise.push(
            api<{ BookingPage: ExternalBookingPagePayload; Code: number }>(
                queryPublicBookingPage(bookingUidBase64Url, {
                    startTime: range.start,
                    endTime: range.end,
                })
            )
        );
        newRanges.push(range);
    }

    const results = await Promise.all(rangePromise);
    return { results, newRanges };
};

const fetchNextAvailableSlot = async ({
    api,
    bookingUidBase64Url,
    startTime,
    nextAvailableSlot,
    bookingSlots,
}: {
    api: Api;
    bookingUidBase64Url: string;
    startTime: number;
    nextAvailableSlot: BookingTimeslot | null;
    bookingSlots: BookingTimeslot[];
}) => {
    const earliestLoadedSlot = bookingSlots
        .filter((slot) => slot.startTime > startTime)
        .sort((a, b) => a.startTime - b.startTime)[0];

    // Do not load the next available slot if there is no need to (e.g. the next slot is still far in the future)
    // Do it when we find a slot that is closer (the user is navigating to the past, and we need to get the next slot)
    const needToGetNextAvailableSlot =
        nextAvailableSlot === null ||
        nextAvailableSlot.startTime < startTime ||
        (earliestLoadedSlot && earliestLoadedSlot.startTime < nextAvailableSlot.startTime); // ;

    if (needToGetNextAvailableSlot) {
        const result = await api<{ NextSlot: ExternalBookingPageSlotsPayload }>(
            getNextAvailableSlot(bookingUidBase64Url, startTime)
        );

        return result.NextSlot ? transformAvailableSlotToTimeslot(result.NextSlot) : null;
    }

    // If no need to update the slot, return the one that we currently have
    return nextAvailableSlot;
};

export const useExternalBookingLoader = () => {
    const api = useSilentApi();
    const location = useLocation();
    const bookingSecretBase64Url = location.hash.substring(1);

    const getUser = useGetUser();
    const getVerificationPreferences = useGetVerificationPreferences();

    const setLoading = useBookingStore((state) => state.setLoading);
    const bookingDetails = useBookingStore((state) => state.bookingDetails);
    const setBookingDetails = useBookingStore((state) => state.setBookingDetails);
    const bookingSlots = useBookingStore((state) => state.bookingSlots);
    const setBookingSlots = useBookingStore((state) => state.setBookingSlots);
    const nextAvailableSlot = useBookingStore((state) => state.nextAvailableSlot);
    const setNextAvailableSlot = useBookingStore((state) => state.setNextAvailableSlot);
    const setFailedToVerify = useBookingStore((state) => state.setFailedToVerify);
    const loadedRanges = useBookingStore((state) => state.loadedRanges);
    const setLoadedRanges = useBookingStore((state) => state.setLoadedRanges);

    /**
     * The logic here is to load public booking
     * We split the request per week so max 7 days per request to prevent BE load
     * We also depend on the mini calendar view showing 6-week rows.
     * So we are requesting those 6 weeks by default. The minimum is the current date (today)
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

            const [{ results, newRanges }, nextAvailableSlotResult] = await Promise.all([
                fetchBookingRanges({ api, bookingUidBase64Url, loadedRanges, weekRangeSimple }),
                fetchNextAvailableSlot({
                    api,
                    bookingUidBase64Url,
                    startTime: getUnixTime(endOfDay(rangeEndDate || rangeStart)),
                    nextAvailableSlot,
                    bookingSlots,
                }),
            ]);

            setLoadedRanges(newRanges);

            const allBookingSlots = results.flatMap((result) =>
                result.BookingPage.AvailableSlots.map(transformAvailableSlotToTimeslot)
            );

            const bookingPageData = results[0]?.BookingPage;

            if (!bookingPageData && !bookingDetails) {
                throw new Error(c('Error').t`No booking page data received`);
            }

            // During the initial load, we also want to check verification keys and set the booking details in the store
            if (!bookingDetails && bookingPageData) {
                const verificationPreferences = await fetchVerificationKeys(
                    getUser,
                    getVerificationPreferences,
                    bookingPageData.Email
                );

                const {
                    summary,
                    description,
                    location,
                    withProtonMeetLink,
                    failedToVerify: failedToVerifyContent,
                } = await decryptBookingContent({
                    encryptedContent: bookingPageData.EncryptedContent,
                    bookingSecretBytes,
                    bookingKeySalt: bookingPageData.BookingKeySalt,
                    calendarId: bookingPageData.CalendarID,
                    bookingUID: bookingPageData.BookingUID,
                    verificationPreferences,
                });

                let failedToVerifyCalendarKey = false;
                const calendarPublicKey = await CryptoProxy.importPublicKey({
                    binaryKey: Uint8Array.fromBase64(bookingPageData.CalendarPublicKey),
                });

                const { verificationStatus, errors: verificationErrors } = await CryptoProxy.verifyMessage({
                    textData: calendarPublicKey.getSHA256Fingerprints().join(';'),
                    verificationKeys: verificationPreferences?.verifyingKeys ?? [],
                    binarySignature: Uint8Array.fromBase64(bookingPageData.CalendarKeySignature),
                    signatureContext:
                        verificationPreferences && verificationPreferences.verifyingKeys.length > 0
                            ? {
                                  required: true,
                                  value: bookingCalendarKeySignatureContextValue(bookingPageData.BookingUID),
                              }
                            : undefined,
                });
                if (
                    verificationPreferences &&
                    shouldCheckSignatureVerificationStatus(verificationPreferences) &&
                    verificationStatus !== VERIFICATION_STATUS.SIGNED_AND_VALID
                ) {
                    traceInitiativeError(SentryCalendarInitiatives.BOOKINGS, {
                        type: 'calendarPublicKey',
                        verificationErrors,
                        bookingUID: bookingPageData.BookingUID,
                    });

                    failedToVerifyCalendarKey = true;
                }

                const failedToVerify = failedToVerifyCalendarKey || failedToVerifyContent;

                document.title = summary;

                setBookingDetails({
                    calendarId: bookingPageData.CalendarID,
                    bookingUID: bookingPageData.BookingUID,
                    calendarPublicKey,
                    summary,
                    description,
                    location,
                    withProtonMeetLink,
                    duration: bookingPageData.Duration ? bookingPageData.Duration / 60 : undefined,
                    timezone: bookingPageData.Timezone ?? undefined,
                    bookingKeySalt: bookingPageData.BookingKeySalt,
                    inviterDisplayName: bookingPageData.DisplayName,
                    inviterEmail: bookingPageData.Email,
                    version: bookingPageData.Version || 1,
                });

                setFailedToVerify(failedToVerify);
            }

            setBookingSlots(allBookingSlots);
            setNextAvailableSlot(nextAvailableSlotResult);
        } catch (error) {
            throw error;
        } finally {
            setLoading(false);
        }
    };

    return { loadPublicBooking };
};
