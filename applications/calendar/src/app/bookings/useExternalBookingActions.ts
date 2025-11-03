import { useState } from 'react';
import { useLocation } from 'react-router-dom';

import { c } from 'ttag';

import { useApi, useNotifications } from '@proton/components';
import { confirmBookingSlot } from '@proton/shared/lib/api/calendarBookings';
import { traceError } from '@proton/shared/lib/helpers/sentry';

import { extractBookingUidFromSecret } from '../containers/bookings/bookingCryptoUtils';
import { useBookingStore } from './booking.store';
import type { BookingTimeslot } from './booking.store';
import { prepareBookingSubmission } from './bookingSubmissionUtils';

interface AttendeeInfo {
    name: string;
    email: string;
}

export const useExternalBookingActions = () => {
    const api = useApi();
    const { createNotification } = useNotifications();
    const location = useLocation();
    const bookingDetails = useBookingStore((state) => state.bookingDetails);

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
                    },
                })
            );

            createNotification({
                type: 'success',
                text: c('Notification').t`Successfully booked this timeslot`,
            });
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
