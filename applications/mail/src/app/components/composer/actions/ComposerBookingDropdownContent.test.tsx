import { fireEvent, screen } from '@testing-library/react';

import { BookingCreateAction, useBookingUpsell } from '@proton/calendar/bookings/store/useBookingUpsell';

import { mailTestRender } from '../../../helpers/tests/render';
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

const mockOnClose = jest.fn();
const mockOnUpsell = jest.fn();
const mockOnLimitReached = jest.fn();

const setup = async (createBookingAction: BookingCreateAction) => {
    jest.mocked(useBookingUpsell).mockReturnValue({
        shouldShowLimitModal: () => ({ bookingPageLimitReached: false, planLimitReached: true }),
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
    fireEvent.click(screen.getByTestId('composer:booking-create'));
};

describe('ComposerBookingDropdownContent create action', () => {
    beforeEach(() => {
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
    });

    it('should open the upsell when the user should be upsold', async () => {
        await setup(BookingCreateAction.Upsell);

        expect(mockOnUpsell).toHaveBeenCalledTimes(1);
        expect(mockOnClose).not.toHaveBeenCalled();
        expect(mockOnLimitReached).not.toHaveBeenCalled();
        expect(window.open).not.toHaveBeenCalled();
    });

    it('should open Calendar to create a page when the user can create one', async () => {
        await setup(BookingCreateAction.Create);

        expect(mockOnClose).toHaveBeenCalledTimes(1);
        expect(window.open).toHaveBeenCalledTimes(1);
        expect(mockOnLimitReached).not.toHaveBeenCalled();
        expect(mockOnUpsell).not.toHaveBeenCalled();
    });
});
