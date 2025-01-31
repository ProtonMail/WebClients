import { render, screen } from '@testing-library/react';

import { CYCLE, PLANS, PLAN_TYPES } from '@proton/payments';
import { APPS } from '@proton/shared/lib/constants';
import { External, type Plan } from '@proton/shared/lib/interfaces';
import { renderWithProviders } from '@proton/testing';
import { buildSubscription, buildUser } from '@proton/testing/builders';

import SubscriptionPanel from './SubscriptionPanel';

describe('SubscriptionPanel', () => {
    const defaultVPNServers = {
        free: { servers: 100, countries: 3 },
        paid: { servers: 1700, countries: 63 },
    };

    const defaultProps = {
        app: APPS.PROTONMAIL,
        user: buildUser(),
        vpnServers: defaultVPNServers,
        upsells: [],
    };

    it('should not render if user cannot pay', () => {
        const { container } = render(<SubscriptionPanel {...defaultProps} user={buildUser({ canPay: false })} />);
        expect(container).toBeEmptyDOMElement();
    });

    it('should not render for trial subscriptions', () => {
        const { container } = render(
            <SubscriptionPanel {...defaultProps} subscription={buildSubscription({ IsTrial: true })} />
        );
        expect(container).toBeEmptyDOMElement();
    });

    it('should render free plan correctly', () => {
        renderWithProviders(<SubscriptionPanel {...defaultProps} user={buildUser()} />);
        expect(screen.getByTestId('plan-name')).toHaveTextContent('Free');
    });

    it('should render paid plan with price correctly', () => {
        renderWithProviders(
            <SubscriptionPanel
                {...defaultProps}
                user={buildUser({ isPaid: true, hasPaidMail: true })}
                subscription={buildSubscription({
                    Plans: [{ Name: PLANS.MAIL, Title: 'Mail Plus', Type: PLAN_TYPES.PLAN } as Plan],
                    Cycle: CYCLE.MONTHLY,
                    Amount: 499,
                })}
            />
        );

        expect(screen.getByTestId('plan-name')).toHaveTextContent('Mail Plus');
        expect(screen.getByTestId('plan-price')).toHaveTextContent('4.99');
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
            expect(screen.getByText(/100 servers in 3 countries/)).toBeInTheDocument();
        });

        it('should render paid VPN features for VPN Plus subscription', () => {
            renderWithProviders(
                <SubscriptionPanel
                    {...defaultProps}
                    app={APPS.PROTONVPN_SETTINGS}
                    user={buildUser({ isPaid: true, hasPaidVpn: true })}
                    subscription={buildSubscription({
                        Plans: [{ Name: PLANS.VPN, Title: 'VPN Plus', Type: PLAN_TYPES.PLAN } as Plan],
                        Cycle: CYCLE.MONTHLY,
                        Amount: 999,
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
            <SubscriptionPanel {...defaultProps} subscription={buildSubscription({ External: External.Android })} />
        );
        expect(screen.queryByTestId('plan-price')).not.toBeInTheDocument();
    });
});
