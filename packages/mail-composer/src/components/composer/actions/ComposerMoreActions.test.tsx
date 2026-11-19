import { fireEvent, screen } from '@testing-library/react';

import { getModelState } from '@proton/account/testing/getModelState';
import { BookingsLimitReached } from '@proton/components/containers/calendar/BookingsLimitReached';
import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';
import { CacheType } from '@proton/redux-utilities/interface';
import { APPS } from '@proton/shared/lib/constants';
import type { UserModel } from '@proton/shared/lib/interfaces/User';
import { useFlag } from '@proton/unleash/useFlag';

import { BookingUpsellSource, useComposerBookingsTracking } from '../../../telemetry/composerBookingsEvents';
import { composerTestRender } from '../../../test-helpers/render';
import ComposerMoreActions from './ComposerMoreActions';

const mockGetInternalBooking = vi.fn();
vi.mock('@proton/calendar/bookings/store/hooks', () => ({
    useGetInternalBooking: () => mockGetInternalBooking,
}));
vi.mock('@proton/unleash/useFlag');
vi.mock('../../../telemetry/composerBookingsEvents', async () => ({
    ...(await vi.importActual('../../../telemetry/composerBookingsEvents')),
    useComposerBookingsTracking: vi.fn(),
}));
vi.mock('@proton/components/hooks/useActiveBreakpoint');
const mockSpotlightClose = vi.fn();
const mockUseComposerBookingSpotlight = vi.fn();
vi.mock('./bookingSpotlight/useComposerBookingSpotlight', () => ({
    useComposerBookingSpotlight: () => mockUseComposerBookingSpotlight(),
    ComposerBookingSpotlightContent: () => null,
}));
vi.mock('./MoreActionsExtension', () => ({
    __esModule: true,
    default: vi.fn(() => null),
}));
vi.mock('./ComposerBookingDropdownContent', () => ({
    __esModule: true,
    default: vi.fn(
        ({ onLimitReached, onUpsell }: { onLimitReached: () => void; onUpsell: (pageCount: string) => void }) => (
            <div data-testid="composer:booking-dropdown">
                <button
                    type="button"
                    aria-label="Limit reached"
                    data-testid="mock:booking-limit-reached"
                    onClick={onLimitReached}
                />
                <button
                    type="button"
                    aria-label="Upsell"
                    data-testid="mock:booking-upsell"
                    onClick={() => onUpsell('1')}
                />
            </div>
        )
    ),
}));
vi.mock('@proton/components/containers/calendar/BookingsLimitReached', () => ({
    BookingsLimitReached: vi.fn(() => <div data-testid="composer:booking-limit-modal" />),
}));
vi.mock('@proton/components/components/upsell/UpsellModal/UpsellModal', () => ({
    __esModule: true,
    default: vi.fn(
        ({
            'data-testid': dataTestId,
            onClose,
            onSubscribed,
        }: {
            'data-testid': string;
            onClose: () => void;
            onSubscribed: () => void;
        }) => (
            <div data-testid={dataTestId}>
                <button type="button" aria-label="Dismiss upsell" data-testid="mock:upsell-dismiss" onClick={onClose} />
                <button
                    type="button"
                    aria-label="Subscribed"
                    data-testid="mock:upsell-subscribed"
                    onClick={onSubscribed}
                />
            </div>
        )
    ),
}));

const mockViewport = (isSmallViewport: boolean) => {
    vi.mocked(useActiveBreakpoint).mockReturnValue({
        viewportWidth: { '<=small': isSmallViewport },
    } as ReturnType<typeof useActiveBreakpoint>);
};

// The dropdown stays mounted for its closing animation, which never ends in jsdom
const expectBookingDropdownClosing = () => {
    expect(screen.getByTestId('composer:booking-dropdown').closest('.dropdown')).toHaveClass('is-dropdown-out');
};

const setup = async ({
    isFree,
    canPay = true,
    isPlainText = false,
}: {
    isFree: boolean;
    canPay?: boolean;
    isPlainText?: boolean;
}) => {
    await composerTestRender(
        <ComposerMoreActions
            isExpiration={false}
            message={{ localID: 'local-id', data: {} } as any}
            onExpiration={vi.fn()}
            lock={false}
            onChangeFlag={vi.fn()}
            editorActionsRef={{ current: undefined }}
            editorMetadata={{ isPlainText } as any}
            onChange={vi.fn()}
            onSwitchToPlainText={vi.fn()}
            isPassword={false}
            onPassword={vi.fn()}
            onRemoveOutsideEncryption={vi.fn()}
            onDelete={vi.fn()}
        />,
        { preloadedState: { user: getModelState({ isFree, canPay, Flags: {} } as UserModel) } }
    );
};

const mockTracking = {
    trackBookingActionClick: vi.fn(),
    trackBookingPageInserted: vi.fn(),
    trackCreateBookingPageClick: vi.fn(),
    trackBookingUpsellDisplayed: vi.fn(),
    trackBookingLimitDisplayed: vi.fn(),
    trackBookingUpsellDismissed: vi.fn(),
    trackBookingUpsellSubscribed: vi.fn(),
};

describe('ComposerMoreActions booking action', () => {
    beforeEach(() => {
        vi.mocked(useFlag).mockImplementation((flag) => {
            return flag === 'BookingsInComposerEnabled';
        });
        vi.mocked(useComposerBookingsTracking).mockReturnValue(mockTracking);
        mockViewport(false);
        mockUseComposerBookingSpotlight.mockReturnValue({
            shouldShowSpotlight: false,
            onDisplayed: vi.fn(),
            onClose: mockSpotlightClose,
        });
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should open the upsell directly for a free user', async () => {
        await setup({ isFree: true });
        fireEvent.click(screen.getByTestId('composer:booking-button'));

        expect(screen.getByTestId('composer:booking-upsell-modal')).toBeInTheDocument();
        expect(screen.queryByTestId('composer:booking-dropdown')).not.toBeInTheDocument();
        expect(mockGetInternalBooking).not.toHaveBeenCalled();
        expect(mockTracking.trackBookingActionClick).toHaveBeenCalledTimes(1);
        expect(mockTracking.trackBookingUpsellDisplayed).toHaveBeenCalledWith({
            source: BookingUpsellSource.booking_action,
        });
    });

    it('should open the booking dropdown instead of the upsell for a free user who cannot pay', async () => {
        await setup({ isFree: true, canPay: false });
        fireEvent.click(screen.getByTestId('composer:booking-button'));

        expect(screen.getByTestId('composer:booking-dropdown')).toBeInTheDocument();
        expect(screen.queryByTestId('composer:booking-upsell-modal')).not.toBeInTheDocument();
        expect(mockTracking.trackBookingActionClick).toHaveBeenCalledTimes(1);
        expect(mockTracking.trackBookingUpsellDisplayed).not.toHaveBeenCalled();
    });

    it('should open the booking dropdown for a paid user', async () => {
        await setup({ isFree: false });
        fireEvent.click(screen.getByTestId('composer:booking-button'));

        expect(screen.getByTestId('composer:booking-dropdown')).toBeInTheDocument();
        expect(screen.queryByTestId('composer:booking-upsell-modal')).not.toBeInTheDocument();
        expect(mockTracking.trackBookingActionClick).toHaveBeenCalledTimes(1);
        expect(mockTracking.trackBookingUpsellDisplayed).not.toHaveBeenCalled();
    });

    it('should refetch the booking pages when the dropdown opens', async () => {
        await setup({ isFree: false });
        fireEvent.click(screen.getByTestId('composer:booking-button'));

        expect(mockGetInternalBooking).toHaveBeenCalledTimes(1);
        expect(mockGetInternalBooking).toHaveBeenCalledWith({ cache: CacheType.None });
    });

    it('should close the booking dropdown without refetching or reporting a click when the button is clicked again', async () => {
        await setup({ isFree: false });
        fireEvent.click(screen.getByTestId('composer:booking-button'));
        fireEvent.click(screen.getByTestId('composer:booking-button'));

        expectBookingDropdownClosing();
        expect(mockGetInternalBooking).toHaveBeenCalledTimes(1);
        expect(mockTracking.trackBookingActionClick).toHaveBeenCalledTimes(1);
    });

    it('should close the booking spotlight when the more options menu opens', async () => {
        await setup({ isFree: false });
        fireEvent.click(screen.getByTestId('composer:more-options-button'));

        expect(mockSpotlightClose).toHaveBeenCalledTimes(1);
    });

    it('should close the booking dropdown and open the booking limit modal when the dropdown reports the limit is reached', async () => {
        await setup({ isFree: false });
        fireEvent.click(screen.getByTestId('composer:booking-button'));

        expect(screen.queryByTestId('composer:booking-limit-modal')).not.toBeInTheDocument();
        fireEvent.click(screen.getByTestId('mock:booking-limit-reached'));

        expect(screen.getByTestId('composer:booking-limit-modal')).toBeInTheDocument();
        expect(screen.queryByTestId('composer:booking-upsell-modal')).not.toBeInTheDocument();
        expectBookingDropdownClosing();
    });

    it('should close the booking dropdown and open the upsell when the dropdown reports an upsell', async () => {
        await setup({ isFree: false });
        fireEvent.click(screen.getByTestId('composer:booking-button'));
        fireEvent.click(screen.getByTestId('mock:booking-upsell'));

        expect(screen.getByTestId('composer:booking-upsell-modal')).toBeInTheDocument();
        expectBookingDropdownClosing();
    });

    it.each([
        ['dismissed', 'mock:upsell-dismiss', 'trackBookingUpsellDismissed'],
        ['subscribed', 'mock:upsell-subscribed', 'trackBookingUpsellSubscribed'],
    ] as const)('should report the direct upsell as %s with its source', async (_, testId, track) => {
        await setup({ isFree: true });
        fireEvent.click(screen.getByTestId('composer:booking-button'));
        fireEvent.click(screen.getByTestId(testId));

        expect(mockTracking[track]).toHaveBeenCalledTimes(1);
        expect(mockTracking[track]).toHaveBeenCalledWith({ source: BookingUpsellSource.booking_action });
    });

    it.each([
        ['dismissed', 'mock:upsell-dismiss', 'trackBookingUpsellDismissed'],
        ['subscribed', 'mock:upsell-subscribed', 'trackBookingUpsellSubscribed'],
    ] as const)(
        'should report the upsell from Create a booking page as %s with its source and page count',
        async (_, testId, track) => {
            await setup({ isFree: false });
            fireEvent.click(screen.getByTestId('composer:booking-button'));
            fireEvent.click(screen.getByTestId('mock:booking-upsell'));
            fireEvent.click(screen.getByTestId(testId));

            expect(mockTracking[track]).toHaveBeenCalledWith({
                source: BookingUpsellSource.create_booking_page,
                pageCount: '1',
            });
        }
    );

    it('should open the booking limit modal with the Mail copy', async () => {
        await setup({ isFree: false });
        fireEvent.click(screen.getByTestId('composer:booking-button'));
        fireEvent.click(screen.getByTestId('mock:booking-limit-reached'));

        expect(vi.mocked(BookingsLimitReached).mock.calls.map(([props]) => props)).toContainEqual(
            expect.objectContaining({ app: APPS.PROTONMAIL })
        );
    });

    it('should disable the booking button in a plain text composer', async () => {
        await setup({ isFree: false, isPlainText: true });

        expect(screen.getByTestId('composer:booking-button')).toBeDisabled();
    });

    it('should open the booking dropdown from the more options menu on small viewports', async () => {
        mockViewport(true);
        await setup({ isFree: false });

        expect(screen.queryByTestId('composer:booking-button')).not.toBeInTheDocument();

        fireEvent.click(screen.getByTestId('composer:more-options-button'));
        fireEvent.click(screen.getByTestId('composer:booking-button'));

        expect(screen.getByTestId('composer:booking-dropdown')).toBeInTheDocument();
        expect(mockTracking.trackBookingActionClick).toHaveBeenCalledTimes(1);
    });

    it('should close the booking dropdown when the more options menu opens again on small viewports', async () => {
        mockViewport(true);
        await setup({ isFree: false });

        fireEvent.click(screen.getByTestId('composer:more-options-button'));
        fireEvent.click(screen.getByTestId('composer:booking-button'));
        fireEvent.click(screen.getByTestId('composer:more-options-button'));

        expectBookingDropdownClosing();
        expect(screen.getByTestId('composer:expiration-button')).toBeInTheDocument();
    });
});
