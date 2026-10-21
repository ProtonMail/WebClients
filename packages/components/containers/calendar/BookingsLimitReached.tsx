import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { Button } from '@proton/atoms/Button/Button';
import { MAX_BOOKING_PAGES } from '@proton/calendar/bookings/eligibility';
import { useInternalBooking } from '@proton/calendar/bookings/store/hooks';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS, CALENDAR_APP_NAME } from '@proton/shared/lib/constants';

import type { ModalStateProps } from '../../components/modalTwo/useModalState';
import Prompt from '../../components/prompt/Prompt';

interface Props extends ModalStateProps {
    /** The app the modal is opened from. Outside Calendar, the copy points to Calendar's Booking pages sidebar. */
    app?: APP_NAMES;
}

export const BookingsLimitReached = ({ app = APPS.PROTONCALENDAR, ...modalProps }: Props) => {
    const [user] = useUser();
    const [bookings] = useInternalBooking();

    const isInCalendar = app === APPS.PROTONCALENDAR;

    const getRemovePageCopy = () => {
        return isInCalendar
            ? c('Info').t`To add a new booking page, remove an existing one from the Booking pages sidebar.`
            : c('Info')
                  .t`To add a new booking page, remove an existing one from the Booking pages sidebar in ${CALENDAR_APP_NAME}.`;
    };

    const getDetailsCopy = () => {
        const pageLength = bookings?.bookingPages?.length || 0;
        if (pageLength >= MAX_BOOKING_PAGES) {
            return getRemovePageCopy();
        }

        const hasBookingPages = pageLength > 0;
        if (user.canPay) {
            return hasBookingPages ? getRemovePageCopy() : c('Info').t`To add a new booking page, upgrade your plan.`;
        }

        if (!hasBookingPages) {
            return c('Info').t`To add a new booking page, ask your admin to upgrade your plan.`;
        }

        return isInCalendar
            ? c('Info').t`Ask your admin to upgrade the plan or remove a page from the Booking pages sidebar.`
            : c('Info')
                  .t`Ask your admin to upgrade the plan or remove a page from the Booking pages sidebar in ${CALENDAR_APP_NAME}.`;
    };

    return (
        <Prompt
            title={c('Title').t`Cannot create more Booking pages`}
            buttons={[<Button onClick={modalProps.onClose}>{c('Action').t`Close`}</Button>]}
            {...modalProps}
        >
            <p className="m-0 mb-2">{c('Info')
                .t`You've reached the maximum number of booking pages available in your plan.`}</p>
            <p className="m-0">{getDetailsCopy()}</p>
        </Prompt>
    );
};
