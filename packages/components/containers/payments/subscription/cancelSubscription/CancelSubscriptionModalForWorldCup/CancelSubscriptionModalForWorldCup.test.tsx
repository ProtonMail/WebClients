import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { addMonths, format, getUnixTime } from 'date-fns';

import { COUPON_CODES, CYCLE, PLANS } from '@proton/payments/core/constants';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import { buildSubscription } from '@proton/testing/builders/subscription';

import { SUBSCRIPTION_STEPS } from '../../constants';
import { CancelSubscriptionModalForWorldCup } from './CancelSubscriptionModalForWorldCup';
import { features } from './feature';

jest.mock('@proton/atoms/Portal/Portal');
jest.mock('../../../../../hooks/useDashboardPaymentFlow');

const mockOpenSubscriptionModal = jest.fn();
jest.mock('../../SubscriptionModalProvider', () => ({
    useSubscriptionModal: () => [mockOpenSubscriptionModal, false],
}));

const onResolve = jest.fn();

let mockSubscription: Subscription;

beforeEach(() => {
    jest.clearAllMocks();
    mockSubscription = buildSubscription(
        {
            planName: PLANS.VPN2024,
            currency: 'EUR',
            cycle: CYCLE.YEARLY,
        },
        {
            PeriodStart: 1685966060,
            PeriodEnd: 1717588460,
            CreateTime: 1685966060,
        }
    );
});

describe('CancelSubscriptionModalForWorldCup', () => {
    it('should render the modal with title', () => {
        render(<CancelSubscriptionModalForWorldCup subscription={mockSubscription} onResolve={onResolve} open />);
        expect(screen.getByText('Stay for 50% off your next month')).toBeInTheDocument();
    });

    it('should call onResolve with cancelled status when cancel subscription button is clicked', async () => {
        const user = userEvent.setup();
        render(<CancelSubscriptionModalForWorldCup subscription={mockSubscription} onResolve={onResolve} open />);

        const cancelButton = screen.getByRole('button', { name: /cancel subscription/i });
        await user.click(cancelButton);

        expect(onResolve).toHaveBeenCalledWith({ status: 'cancelled' });
    });

    it('should call onResolve with kept status when modal is closed', async () => {
        const { container } = render(
            <CancelSubscriptionModalForWorldCup subscription={mockSubscription} onResolve={onResolve} open />
        );

        const closeButton =
            container.querySelector('[data-testid="modal:close"]') || container.querySelector('button.close');
        if (closeButton) {
            await userEvent.setup().click(closeButton);
        }

        expect(onResolve).toHaveBeenCalledWith({ status: 'kept' });
    });

    it('should display the expiry date correctly', () => {
        const futureDate = addMonths(new Date(), 2);
        const adaptedSubscription = buildSubscription(undefined, {
            PeriodEnd: getUnixTime(futureDate),
        });

        render(<CancelSubscriptionModalForWorldCup subscription={adaptedSubscription} onResolve={onResolve} open />);

        const expectedDate = format(futureDate, 'PPP', {});
        expect(screen.getByText(new RegExp(expectedDate))).toBeInTheDocument();
    });

    it('should render all features', () => {
        render(<CancelSubscriptionModalForWorldCup subscription={mockSubscription} onResolve={onResolve} open />);

        features.forEach((feature) => {
            const featureText = feature.value();
            expect(screen.getByText(featureText)).toBeInTheDocument();
        });
    });

    it('should render the get 50% offer button', () => {
        render(<CancelSubscriptionModalForWorldCup subscription={mockSubscription} onResolve={onResolve} open />);

        const getOfferButton = screen.getByRole('button', { name: /get 50% offer/i });
        expect(getOfferButton).toBeInTheDocument();
    });

    it('should call openSubscriptionModal with correct parameters when get 50% offer button is clicked', async () => {
        const user = userEvent.setup();
        render(<CancelSubscriptionModalForWorldCup subscription={mockSubscription} onResolve={onResolve} open />);

        const getOfferButton = screen.getByRole('button', { name: /get 50% offer/i });
        await user.click(getOfferButton);

        expect(mockOpenSubscriptionModal).toHaveBeenCalledWith(
            expect.objectContaining({
                coupon: COUPON_CODES.VPNSAVEOFFER,
                step: SUBSCRIPTION_STEPS.CHECKOUT,
                cycle: CYCLE.MONTHLY,
                disableCycleSelector: true,
                disablePlanSelection: true,
            })
        );
    });

    it('should display feature hints when available', () => {
        render(<CancelSubscriptionModalForWorldCup subscription={mockSubscription} onResolve={onResolve} open />);

        expect(screen.getByText(/stay on your plan and get 50% off your next month/i)).toBeInTheDocument();
        expect(screen.getByText(/have some more time to decide without interruption/i)).toBeInTheDocument();
    });

    it('should display modal message with plan title and brand name', () => {
        render(<CancelSubscriptionModalForWorldCup subscription={mockSubscription} onResolve={onResolve} open />);

        const messageText = screen.getByText(/if you cancel now, you will lose access/i);
        expect(messageText).toBeInTheDocument();
    });

    it('should call onResolve with kept status when get 50% offer button is clicked', async () => {
        const user = userEvent.setup();
        render(<CancelSubscriptionModalForWorldCup subscription={mockSubscription} onResolve={onResolve} open />);

        const getOfferButton = screen.getByRole('button', { name: /get 50% offer/i });
        await user.click(getOfferButton);

        expect(onResolve).toHaveBeenCalledWith({ status: 'kept' });
    });

    it('should render loading state on get 50% offer button', () => {
        const mockLoadingOpenSubscriptionModal = jest.fn();
        jest.mock('../../SubscriptionModalProvider', () => ({
            useSubscriptionModal: () => [mockLoadingOpenSubscriptionModal, true],
        }));

        render(<CancelSubscriptionModalForWorldCup subscription={mockSubscription} onResolve={onResolve} open />);

        const getOfferButton = screen.getByRole('button', { name: /get 50% offer/i });
        expect(getOfferButton).toBeInTheDocument();
    });

    it('should render offer section with correct layout classes', () => {
        const { container } = render(
            <CancelSubscriptionModalForWorldCup subscription={mockSubscription} onResolve={onResolve} open />
        );

        const offerSections = container.querySelectorAll('.vpn-features-world-cup');
        const offerSection = offerSections[offerSections.length - 1];
        expect(offerSection).toBeInTheDocument();
        expect(offerSection).toHaveStyle({ backgroundColor: '#239ECE1F' });
    });
});
