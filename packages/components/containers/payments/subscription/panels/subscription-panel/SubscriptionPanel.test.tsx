import { screen } from '@testing-library/react';

import { CYCLE, PLANS } from '@proton/payments/core/constants';
import { createEntitlementResolver } from '@proton/payments/core/entitlements/resolver';
import { Renew, SubscriptionPlatform, TrialType } from '@proton/payments/core/subscription/constants';
import { buildSubscription } from '@proton/payments/testing/buildSubscription';
import { APPS } from '@proton/shared/lib/constants';
import { buildUser } from '@proton/testing/builders/user';
import { renderWithProviders } from '@proton/testing/lib/context/renderWithProviders';

import SubscriptionPanel from './SubscriptionPanel';

jest.mock('@proton/vpn/constants/vpnServers', () => ({
    VPN_SERVERS: {
        free: { servers: 10, countries: 2000 },
        paid: { servers: 1700, countries: 63 },
    },
}));

let mockUsePaymentMethods: jest.Mock;

jest.mock('@proton/account/paymentMethods/hooks', () => ({
    usePaymentMethods: () => mockUsePaymentMethods(),
}));

describe('SubscriptionPanel', () => {
    const defaultEntitlements = createEntitlementResolver(undefined);

    const defaultProps = {
        app: APPS.PROTONMAIL,
        user: buildUser(),
        upsells: [],
        subscription: undefined,
        entitlements: defaultEntitlements,
    };

    beforeEach(() => {
        mockUsePaymentMethods = jest.fn().mockReturnValue([[{}] as any, false]);
    });

    it('should not render if user cannot pay', () => {
        const { container } = renderWithProviders(
            <SubscriptionPanel {...defaultProps} user={buildUser({ canPay: false })} />
        );
        expect(container).toBeEmptyDOMElement();
    });

    it('should not render for referral trials', () => {
        const { container } = renderWithProviders(
            <SubscriptionPanel
                {...defaultProps}
                subscription={buildSubscription(undefined, { IsTrial: true, TrialType: TrialType.ReferralProgram })}
            />
        );
        expect(container).toBeEmptyDOMElement();
    });

    it('should not render for family trials', () => {
        const { container } = renderWithProviders(
            <SubscriptionPanel
                {...defaultProps}
                subscription={buildSubscription(undefined, { IsTrial: true, TrialType: TrialType.FamilyPlan })}
            />
        );
        expect(container).toBeEmptyDOMElement();
    });

    it('should render combined sentence for manual trial with payment method', () => {
        renderWithProviders(
            <SubscriptionPanel
                {...defaultProps}
                subscription={buildSubscription(undefined, { IsTrial: true, TrialType: TrialType.Manual })}
            />
        );

        expect(screen.getByText('Free trial')).toBeInTheDocument();
        expect(screen.getByTestId('period-end')).toBeInTheDocument();
        expect(screen.getByText('Learn more')).toBeInTheDocument();
        expect(screen.getByText(/your free trial ends and your paid plan starts/i)).toBeInTheDocument();
        expect(screen.queryByText(/Active until/)).not.toBeInTheDocument();
    });

    it('should render Active until without Learn more for manual trial without payment method', () => {
        mockUsePaymentMethods = jest.fn().mockReturnValue([undefined, false]);

        renderWithProviders(
            <SubscriptionPanel
                {...defaultProps}
                subscription={buildSubscription(undefined, { IsTrial: true, TrialType: TrialType.Manual })}
            />
        );

        expect(screen.getByText('Free trial')).toBeInTheDocument();
        expect(screen.getByTestId('period-end')).toBeInTheDocument();
        expect(screen.getByText(/Active until/)).toBeInTheDocument();
        expect(screen.queryByText('Learn more')).not.toBeInTheDocument();
        expect(screen.queryByText(/your free trial ends and your paid plan starts/i)).not.toBeInTheDocument();
    });

    it('should render Active until without Learn more for cancelled trial', () => {
        mockUsePaymentMethods = jest.fn().mockReturnValue([[{}] as any, false]);

        renderWithProviders(
            <SubscriptionPanel
                {...defaultProps}
                subscription={buildSubscription(undefined, {
                    IsTrial: true,
                    TrialType: TrialType.Manual,
                    Renew: Renew.Disabled,
                })}
            />
        );

        expect(screen.getByText('Free trial')).toBeInTheDocument();
        expect(screen.getByTestId('period-end')).toBeInTheDocument();
        expect(screen.getByText(/Active until/)).toBeInTheDocument();
        expect(screen.queryByText('Learn more')).not.toBeInTheDocument();
    });

    it('should not render the trial date while payment methods are loading', () => {
        mockUsePaymentMethods = jest.fn().mockReturnValue([undefined, true]);

        renderWithProviders(
            <SubscriptionPanel
                {...defaultProps}
                subscription={buildSubscription(undefined, { IsTrial: true, TrialType: TrialType.Manual })}
            />
        );

        expect(screen.getByText('Free trial')).toBeInTheDocument();
        expect(screen.queryByTestId('period-end')).not.toBeInTheDocument();
    });

    it('should render combined sentence for B2B trial with payment method', () => {
        renderWithProviders(
            <SubscriptionPanel
                {...defaultProps}
                subscription={buildSubscription(
                    { planName: PLANS.MAIL_BUSINESS, currency: 'CHF', cycle: CYCLE.MONTHLY },
                    { IsTrial: true }
                )}
            />
        );

        expect(screen.getByText('Free trial')).toBeInTheDocument();
        expect(screen.getByTestId('period-end')).toBeInTheDocument();
        expect(screen.getByText(/your free trial ends and your paid plan starts/i)).toBeInTheDocument();
        expect(screen.getByText('Learn more')).toBeInTheDocument();
    });

    it('should render Active until without Learn more for B2B trial without payment method', () => {
        mockUsePaymentMethods = jest.fn().mockReturnValue([undefined, false]);

        renderWithProviders(
            <SubscriptionPanel
                {...defaultProps}
                subscription={buildSubscription(
                    { planName: PLANS.MAIL_BUSINESS, currency: 'CHF', cycle: CYCLE.MONTHLY },
                    { IsTrial: true }
                )}
            />
        );

        expect(screen.getByText('Free trial')).toBeInTheDocument();
        expect(screen.getByTestId('period-end')).toBeInTheDocument();
        expect(screen.getByText(/Active until/)).toBeInTheDocument();
        expect(screen.queryByText('Learn more')).not.toBeInTheDocument();
    });

    it('should not fetch payment methods for non-trial subscriptions', () => {
        renderWithProviders(<SubscriptionPanel {...defaultProps} subscription={buildSubscription()} />);

        expect(mockUsePaymentMethods).not.toHaveBeenCalled();
    });

    it('should render free plan correctly', () => {
        renderWithProviders(<SubscriptionPanel {...defaultProps} user={buildUser()} />);
        expect(screen.getByTestId('plan-name')).toHaveTextContent('Free');
    });

    it('should render paid plan name correctly', () => {
        renderWithProviders(
            <SubscriptionPanel
                {...defaultProps}
                user={buildUser({ isPaid: true, hasPaidMail: true })}
                subscription={buildSubscription({
                    planName: PLANS.MAIL,
                    cycle: CYCLE.MONTHLY,
                    currency: 'USD',
                })}
            />
        );

        expect(screen.getByTestId('plan-name')).toHaveTextContent('Mail Plus');
    });

    it('should render pass lifetime name if user has pass lifetime', () => {
        renderWithProviders(
            <SubscriptionPanel
                {...defaultProps}
                user={buildUser({ isFree: true, isPaid: false, hasPassLifetime: true })}
            />
        );
        expect(screen.getByTestId('plan-name')).toHaveTextContent('Pass + SimpleLogin Lifetime');
    });

    it('should render subscription plan name if user has pass lifetime and some subscription', () => {
        renderWithProviders(
            <SubscriptionPanel
                {...defaultProps}
                user={buildUser({ isFree: false, isPaid: true, hasPassLifetime: true })}
                subscription={buildSubscription()}
            />
        );
        expect(screen.getByTestId('plan-name')).toHaveTextContent('Proton Unlimited');
    });

    it('should render free plan if user is free', () => {
        renderWithProviders(
            <SubscriptionPanel
                {...defaultProps}
                user={buildUser({ isFree: true, isPaid: false, hasPassLifetime: false })}
            />
        );
        expect(screen.getByTestId('plan-name')).toHaveTextContent('Free');
    });

    describe('VPN specific rendering', () => {
        it('should render free VPN features when in VPN app', () => {
            renderWithProviders(
                <SubscriptionPanel {...defaultProps} app={APPS.PROTONVPN_SETTINGS} user={buildUser({ isFree: true })} />
            );
            expect(screen.getByText('1 VPN connection')).toBeInTheDocument();
            expect(screen.getByText('10+ servers in 2000 countries')).toBeInTheDocument();
        });

        it('should render paid VPN features for VPN Plus subscription', () => {
            renderWithProviders(
                <SubscriptionPanel
                    {...defaultProps}
                    app={APPS.PROTONVPN_SETTINGS}
                    user={buildUser({ isPaid: true, hasPaidVpn: true })}
                    subscription={buildSubscription({
                        planName: PLANS.VPN2024,
                        cycle: CYCLE.MONTHLY,
                        currency: 'USD',
                    })}
                />
            );

            expect(screen.getByText('1700+ servers across 63+ countries')).toBeInTheDocument();
            expect(screen.getByText(/Built-in ad blocker/)).toBeInTheDocument();
            expect(screen.getByText(/Access to streaming services/)).toBeInTheDocument();
        });
    });

    it('should not render price if subscription is managed externally', () => {
        renderWithProviders(
            <SubscriptionPanel
                {...defaultProps}
                subscription={buildSubscription(undefined, { External: SubscriptionPlatform.Android })}
            />
        );
        expect(screen.queryByTestId('plan-price')).not.toBeInTheDocument();
    });
});
