import { useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

import { fromUnixTime } from 'date-fns';

import { useApi } from '@proton/components';
import { useSaveMeeting } from '@proton/meet';
import { confirmBookingSlot } from '@proton/shared/lib/api/calendarBookings';
import { traceError } from '@proton/shared/lib/helpers/sentry';

import { extractBookingUidFromSecret } from '../containers/bookings/utils/bookingCryptoUtils';
import { useBookingStore } from './booking.store';
import type { BookingTimeslot } from './booking.store';
import { prepareBookingSubmission } from './bookingSubmissionUtils';

interface AttendeeInfo {
    name: string;
    email: string;
}

export const useExternalBookingActions = () => {
    const api = useApi();
    const location = useLocation();
    const bookingDetails = useBookingStore((state) => state.bookingDetails);
    const setBookingSlotDetails = useBookingStore((state) => state.setBookingSlotDetails);
    const saveMeeting = useSaveMeeting();

    const history = useHistory();

    const bookingSecretBase64Url = location.hash.substring(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const submitBooking = async (timeslot: BookingTimeslot, attendeeInfo: AttendeeInfo) => {
        if (!bookingDetails) {
            throw new Error('Booking details not available');
        }

        setIsSubmitting(true);
        try {
            const bookingUidBase64Url = await extractBookingUidFromSecret(bookingSecretBase64Url);

            const submissionData = await prepareBookingSubmission({
                timeslot,
                bookingDetails,
                bookingSecretBase64Url,
                bookingKeySalt: bookingDetails.bookingKeySalt,
                attendeeName: attendeeInfo.name,
                attendeeEmail: attendeeInfo.email,
                organizerName: bookingDetails.inviterDisplayName,
                organizerEmail: bookingDetails.inviterEmail,
                saveMeeting,
            });

            await api(
                confirmBookingSlot(bookingUidBase64Url, timeslot.id, {
                    ContentPart: submissionData.contentPart,
                    TimePart: submissionData.timePart,
                    AttendeeData: submissionData.attendeeData,
                    AttendeeToken: submissionData.attendeeToken,
                    EmailData: {
                        Name: submissionData.emailData.name,
                        Email: submissionData.emailData.email,
                        Ics: submissionData.ics,
                        Type: 'external',
                    },
                })
            );

            const startTimeDate = fromUnixTime(timeslot.startTime);
            const endTimeDate = fromUnixTime(timeslot.endTime);

            setBookingSlotDetails({
                startTime: startTimeDate,
                endTime: endTimeDate,
            });
            history.push('/success');
        } catch (error: unknown) {
            traceError(error);
            throw error;
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
        bookingSecretBase64Url,
        bookingDetails,
        submitBooking,
        isSubmitting,
    };
};
