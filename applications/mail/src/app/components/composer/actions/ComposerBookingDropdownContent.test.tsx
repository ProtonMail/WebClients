import { fireEvent, screen } from '@testing-library/react';

import { BookingCreateAction, useBookingUpsell } from '@proton/calendar/bookings/store/useBookingUpsell';

import { mailTestRender } from '../../../helpers/tests/render';
import {
    BookingLimitReason,
    BookingUpsellSource,
    useComposerBookingsTracking,
} from '../../../telemetry/composerBookingsEvents';
import ComposerBookingDropdownContent from './ComposerBookingDropdownContent';

jest.mock('@proton/calendar/bookings/store/hooks', () => ({
    useInternalBooking: () => [
        { bookingPages: [{ id: 'page-1', summary: 'Booking page 01', link: 'https://example.com/booking' }] },
        false,
    ],
}));
jest.mock('@proton/calendar/bookings/store/useBookingUpsell', () => ({
    ...jest.requireActual('@proton/calendar/bookings/store/useBookingUpsell'),
    useBookingUpsell: jest.fn(),
}));
jest.mock('@proton/components/hooks/useAuthentication', () => ({
    __esModule: true,
    default: () => ({ getLocalID: () => 0 }),
}));
jest.mock('../../../telemetry/composerBookingsEvents', () => ({
    ...jest.requireActual('../../../telemetry/composerBookingsEvents'),
    useComposerBookingsTracking: jest.fn(),
}));

const mockOnClose = jest.fn();
const mockOnUpsell = jest.fn();
const mockOnLimitReached = jest.fn();
const mockTracking = {
    trackBookingActionClick: jest.fn(),
    trackBookingPageInserted: jest.fn(),
    trackCreateBookingPageClick: jest.fn(),
    trackBookingUpsellDisplayed: jest.fn(),
    trackBookingLimitDisplayed: jest.fn(),
    trackBookingUpsellDismissed: jest.fn(),
    trackBookingUpsellSubscribed: jest.fn(),
};

const render = async (createBookingAction: BookingCreateAction, { bookingPageLimitReached = false } = {}) => {
    jest.mocked(useBookingUpsell).mockReturnValue({
        shouldShowLimitModal: () => ({ bookingPageLimitReached, planLimitReached: !bookingPageLimitReached }),
        getCreateBookingAction: () => createBookingAction,
        loadingLimits: false,
    });

    await mailTestRender(
        <ComposerBookingDropdownContent
            editorActionsRef={{ current: undefined }}
            onClose={mockOnClose}
            onUpsell={mockOnUpsell}
            onLimitReached={mockOnLimitReached}
        />
    );

    await screen.findByTestId('composer:booking-page-item');
};

const setup = async (createBookingAction: BookingCreateAction, options?: { bookingPageLimitReached?: boolean }) => {
    await render(createBookingAction, options);
    fireEvent.click(screen.getByTestId('composer:booking-create'));
};

describe('ComposerBookingDropdownContent create action', () => {
    beforeEach(() => {
        jest.mocked(useComposerBookingsTracking).mockReturnValue(mockTracking);
        jest.spyOn(window, 'open').mockImplementation(() => null);
    });

    afterEach(() => {
        jest.restoreAllMocks();
        jest.clearAllMocks();
    });

    it('should open the limit modal when the user has reached their limit', async () => {
        await setup(BookingCreateAction.LimitReached);

        expect(mockOnLimitReached).toHaveBeenCalledTimes(1);
        expect(mockOnClose).not.toHaveBeenCalled();
        expect(mockOnUpsell).not.toHaveBeenCalled();
        expect(window.open).not.toHaveBeenCalled();
        expect(mockTracking.trackBookingLimitDisplayed).toHaveBeenCalledTimes(1);
        expect(mockTracking.trackBookingLimitDisplayed).toHaveBeenCalledWith(BookingLimitReason.plan_limit, '1');
    });

    it('should report the maximum number of booking pages as the limit reason', async () => {
        await setup(BookingCreateAction.LimitReached, { bookingPageLimitReached: true });

        expect(mockTracking.trackBookingLimitDisplayed).toHaveBeenCalledWith(BookingLimitReason.max_pages, '1');
    });

    it('should open the upsell with the page count when the user should be upsold', async () => {
        await setup(BookingCreateAction.Upsell);

        expect(mockOnUpsell).toHaveBeenCalledTimes(1);
        expect(mockOnUpsell).toHaveBeenCalledWith('1');
        expect(mockOnClose).not.toHaveBeenCalled();
        expect(mockOnLimitReached).not.toHaveBeenCalled();
        expect(window.open).not.toHaveBeenCalled();
        expect(mockTracking.trackBookingUpsellDisplayed).toHaveBeenCalledWith({
            source: BookingUpsellSource.create_booking_page,
            pageCount: '1',
        });
    });

    it('should open Calendar to create a page when the user can create one', async () => {
        await setup(BookingCreateAction.Create);

        expect(mockOnClose).toHaveBeenCalledTimes(1);
        expect(window.open).toHaveBeenCalledTimes(1);
        expect(mockOnLimitReached).not.toHaveBeenCalled();
        expect(mockOnUpsell).not.toHaveBeenCalled();
        expect(mockTracking.trackCreateBookingPageClick).toHaveBeenCalledWith('1');
    });

    it('should report the insertion of a booking page', async () => {
        await render(BookingCreateAction.Create);
        fireEvent.click(screen.getByTestId('composer:booking-page-item'));

        expect(mockOnClose).toHaveBeenCalledTimes(1);
        expect(mockTracking.trackBookingPageInserted).toHaveBeenCalledWith('1');
    });
});
