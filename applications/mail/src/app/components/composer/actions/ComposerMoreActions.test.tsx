import { fireEvent, screen } from '@testing-library/react';

import { getModelState } from '@proton/account/testing/getModelState';
import { BookingsLimitReached } from '@proton/components/containers/calendar/BookingsLimitReached';
import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';
import { CacheType } from '@proton/redux-utilities/interface';
import { APPS } from '@proton/shared/lib/constants';
import type { UserModel } from '@proton/shared/lib/interfaces/User';
import { useFlag } from '@proton/unleash/useFlag';

import { mailTestRender } from '../../../helpers/tests/render';
import ComposerMoreActions from './ComposerMoreActions';

const mockGetInternalBooking = jest.fn();
jest.mock('@proton/calendar/bookings/store/hooks', () => ({
    useGetInternalBooking: () => mockGetInternalBooking,
}));
jest.mock('@proton/unleash/useFlag');
jest.mock('@proton/components/hooks/useActiveBreakpoint');
const mockSpotlightClose = jest.fn();
const mockUseComposerBookingSpotlight = jest.fn();
jest.mock('./bookingSpotlight/useComposerBookingSpotlight', () => ({
    useComposerBookingSpotlight: () => mockUseComposerBookingSpotlight(),
    ComposerBookingSpotlightContent: () => null,
}));
jest.mock('./MoreActionsExtension', () => ({
    __esModule: true,
    default: jest.fn(() => null),
}));
jest.mock('./ComposerBookingDropdownContent', () => ({
    __esModule: true,
    default: jest.fn(({ onLimitReached, onUpsell }: { onLimitReached: () => void; onUpsell: () => void }) => (
        <div data-testid="composer:booking-dropdown">
            <button
                type="button"
                aria-label="Limit reached"
                data-testid="mock:booking-limit-reached"
                onClick={onLimitReached}
            />
            <button type="button" aria-label="Upsell" data-testid="mock:booking-upsell" onClick={onUpsell} />
        </div>
    )),
}));
jest.mock('@proton/components/containers/calendar/BookingsLimitReached', () => ({
    BookingsLimitReached: jest.fn(() => <div data-testid="composer:booking-limit-modal" />),
}));
jest.mock('@proton/components/components/upsell/UpsellModal/UpsellModal', () => ({
    __esModule: true,
    default: jest.fn(({ 'data-testid': dataTestId }: { 'data-testid': string }) => <div data-testid={dataTestId} />),
}));

const mockViewport = (isSmallViewport: boolean) => {
    jest.mocked(useActiveBreakpoint).mockReturnValue({
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
    await mailTestRender(
        <ComposerMoreActions
            isExpiration={false}
            message={{ localID: 'local-id', data: {} } as any}
            onExpiration={jest.fn()}
            lock={false}
            onChangeFlag={jest.fn()}
            editorActionsRef={{ current: undefined }}
            editorMetadata={{ isPlainText } as any}
            onChange={jest.fn()}
            isPassword={false}
            onPassword={jest.fn()}
            onRemoveOutsideEncryption={jest.fn()}
            onDelete={jest.fn()}
        />,
        { preloadedState: { user: getModelState({ isFree, canPay, Flags: {} } as UserModel) } }
    );
};

describe('ComposerMoreActions booking action', () => {
    beforeEach(() => {
        jest.mocked(useFlag).mockImplementation((flag) => {
            return flag === 'BookingsInComposerEnabled';
        });
        mockViewport(false);
        mockUseComposerBookingSpotlight.mockReturnValue({
            shouldShowSpotlight: false,
            onDisplayed: jest.fn(),
            onClose: mockSpotlightClose,
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should open the upsell directly for a free user', async () => {
        await setup({ isFree: true });
        fireEvent.click(screen.getByTestId('composer:booking-button'));

        expect(screen.getByTestId('composer:booking-upsell-modal')).toBeInTheDocument();
        expect(screen.queryByTestId('composer:booking-dropdown')).not.toBeInTheDocument();
        expect(mockGetInternalBooking).not.toHaveBeenCalled();
    });

    it('should open the booking dropdown instead of the upsell for a free user who cannot pay', async () => {
        await setup({ isFree: true, canPay: false });
        fireEvent.click(screen.getByTestId('composer:booking-button'));

        expect(screen.getByTestId('composer:booking-dropdown')).toBeInTheDocument();
        expect(screen.queryByTestId('composer:booking-upsell-modal')).not.toBeInTheDocument();
    });

    it('should open the booking dropdown for a paid user', async () => {
        await setup({ isFree: false });
        fireEvent.click(screen.getByTestId('composer:booking-button'));

        expect(screen.getByTestId('composer:booking-dropdown')).toBeInTheDocument();
        expect(screen.queryByTestId('composer:booking-upsell-modal')).not.toBeInTheDocument();
    });

    it('should refetch the booking pages when the dropdown opens', async () => {
        await setup({ isFree: false });
        fireEvent.click(screen.getByTestId('composer:booking-button'));

        expect(mockGetInternalBooking).toHaveBeenCalledTimes(1);
        expect(mockGetInternalBooking).toHaveBeenCalledWith({ cache: CacheType.None });
    });

    it('should close the booking dropdown without refetching when the button is clicked again', async () => {
        await setup({ isFree: false });
        fireEvent.click(screen.getByTestId('composer:booking-button'));
        fireEvent.click(screen.getByTestId('composer:booking-button'));

        expectBookingDropdownClosing();
        expect(mockGetInternalBooking).toHaveBeenCalledTimes(1);
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

    it('should open the booking limit modal with the Mail copy', async () => {
        await setup({ isFree: false });
        fireEvent.click(screen.getByTestId('composer:booking-button'));
        fireEvent.click(screen.getByTestId('mock:booking-limit-reached'));

        expect(jest.mocked(BookingsLimitReached)).toHaveBeenCalledWith(
            expect.objectContaining({ app: APPS.PROTONMAIL }),
            expect.anything()
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
    });
});
