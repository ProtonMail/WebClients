import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { Button } from '@proton/atoms/Button/Button';
import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import Prompt from '@proton/components/components/prompt/Prompt';

import { useInternalBooking } from '../../../store/internalBooking/bookingsHook';
import { MAX_BOOKING_PAGES } from '../interface';

export const BookingsLimitReached = ({ ...modalProps }: ModalStateProps) => {
    const [user] = useUser();
    const [bookings] = useInternalBooking();

    const getDetailsCopy = () => {
        const pageLength = bookings?.bookingPages?.length || 0;
        if (pageLength >= MAX_BOOKING_PAGES) {
            return c('Info').t`To add a new booking page, remove an existing one from the Booking pages sidebar.`;
        }

        const hasBookingPages = pageLength > 0;
        if (user.canPay) {
            return hasBookingPages
                ? c('Info').t`To add a new booking page, remove an existing one from the Booking pages sidebar.`
                : c('Info').t`To add a new booking page, upgrade your plan.`;
        }

        return hasBookingPages
            ? c('Info').t`Ask your admin to upgrade the plan or remove a page from the Booking pages sidebar.`
            : c('Info').t`To add a new booking page, ask your admin to upgrade your plan.`;
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
