import { render, screen } from '@testing-library/react';

import { useUser } from '@proton/account/user/hooks';
import { MAX_BOOKING_PAGES } from '@proton/calendar/bookings/eligibility';
import { useInternalBooking } from '@proton/calendar/bookings/store/hooks';
import { APPS } from '@proton/shared/lib/constants';
import type { APP_NAMES } from '@proton/shared/lib/constants';

import { BookingsLimitReached } from './BookingsLimitReached';

jest.mock('@proton/account/user/hooks');
jest.mock('@proton/calendar/bookings/store/hooks');

const setup = ({ canPay, pageCount, app }: { canPay: boolean; pageCount: number; app?: APP_NAMES }) => {
    jest.mocked(useUser).mockReturnValue([{ canPay }, false] as any);
    jest.mocked(useInternalBooking).mockReturnValue([
        { bookingPages: Array.from({ length: pageCount }, (_, i) => ({ id: `page-${i}` })) },
        false,
    ] as any);

    render(<BookingsLimitReached app={app} open onClose={jest.fn()} onExit={jest.fn()} />);
};

describe('BookingsLimitReached', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should point to the Booking pages sidebar by default', () => {
        setup({ canPay: true, pageCount: MAX_BOOKING_PAGES });

        expect(
            screen.getByText('To add a new booking page, remove an existing one from the Booking pages sidebar.')
        ).toBeInTheDocument();
    });

    it('should point to the Booking pages sidebar in Calendar when opened from Mail at the maximum', () => {
        setup({ canPay: true, pageCount: MAX_BOOKING_PAGES, app: APPS.PROTONMAIL });

        expect(
            screen.getByText(
                'To add a new booking page, remove an existing one from the Booking pages sidebar in Proton Calendar.'
            )
        ).toBeInTheDocument();
    });

    it('should ask a member to contact their admin or remove a page in Calendar when opened from Mail', () => {
        setup({ canPay: false, pageCount: 1, app: APPS.PROTONMAIL });

        expect(
            screen.getByText(
                'Ask your admin to upgrade the plan or remove a page from the Booking pages sidebar in Proton Calendar.'
            )
        ).toBeInTheDocument();
    });

    it('should ask a member without booking pages to contact their admin', () => {
        setup({ canPay: false, pageCount: 0, app: APPS.PROTONMAIL });

        expect(screen.getByText('To add a new booking page, ask your admin to upgrade your plan.')).toBeInTheDocument();
    });
});
