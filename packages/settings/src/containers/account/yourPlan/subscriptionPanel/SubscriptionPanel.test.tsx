import { screen, within } from '@testing-library/react';
import type { Mock, MockedFunction } from 'vitest';

import { renderWithProviders } from '@proton/components/testing/renderWithProviders';
import { CYCLE, PLANS } from '@proton/payments/core/constants';
import { createEntitlementResolverForOrgAndUser } from '@proton/payments/core/entitlements/resolver';
import type { FullPlansMap } from '@proton/payments/core/subscription/interface';
import { buildEntitlementCatalog } from '@proton/payments/testing/buildEntitlementCatalog';
import { buildSubscription } from '@proton/payments/testing/buildSubscription';
import { PLANS_MAP } from '@proton/payments/testing/data-plans';
import { regularAdmin } from '@proton/payments/testing/regularAdmin';
import { APPS } from '@proton/shared/lib/constants';
import type { Organization } from '@proton/shared/lib/interfaces/Organization';
import { Renew, SubscriptionPlatform, TrialType } from '@proton/shared/lib/payments/subscription/constants';
import { buildUser } from '@proton/shared/testing/buildUser';
import { MailFeatureFlag } from '@proton/unleash/Flags';
import { useFlag } from '@proton/unleash/useFlag';

import SubscriptionPanel from './SubscriptionPanel';

vi.mock('@proton/shared/lib/vpn/vpnServers', () => ({
    VPN_SERVERS: {
        free: { servers: 10, countries: 2000 },
        paid: { servers: 1700, countries: 63 },
    },
}));

vi.mock('@proton/unleash/useFlag');
const mockUseFlag = useFlag as MockedFunction<typeof useFlag>;

let mockUsePaymentMethods: Mock;

vi.mock('@proton/account/paymentMethods/hooks', () => ({
    usePaymentMethods: () => mockUsePaymentMethods(),
}));

describe('SubscriptionPanel', () => {
    const defaultEntitlements = createEntitlementResolverForOrgAndUser({
        entitlementCatalog: buildEntitlementCatalog(),
        entitlements: undefined,
        subscriptions: [],
        ...regularAdmin,
    });

    const defaultProps = {
        app: APPS.PROTONMAIL,
        user: buildUser(),
        upsells: [],
        subscription: undefined,
        entitlements: defaultEntitlements,
    };

    beforeEach(() => {
        mockUsePaymentMethods = vi.fn().mockReturnValue([[{}] as any, false]);
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
        mockUsePaymentMethods = vi.fn().mockReturnValue([undefined, false]);

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
        mockUsePaymentMethods = vi.fn().mockReturnValue([[{}] as any, false]);

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
        mockUsePaymentMethods = vi.fn().mockReturnValue([undefined, true]);

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
        mockUsePaymentMethods = vi.fn().mockReturnValue([undefined, false]);

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

    describe('Lumo free plan', () => {
        const renderLumoFree = (lumoPlans2026: boolean) => {
            mockUseFlag.mockImplementation((flag) => flag === 'LumoPlans2026' && lumoPlans2026);
            renderWithProviders(
                <SubscriptionPanel {...defaultProps} app={APPS.PROTONLUMO} user={buildUser({ isFree: true })} />
            );
        };

        afterEach(() => {
            mockUseFlag.mockReset();
        });

        it('lists what the free plan has with LumoPlans2026 on', () => {
            renderLumoFree(true);

            expect(screen.getByText('Limited messages and chat history')).toBeInTheDocument();
            expect(screen.getByText('Limited Skills, Projects, and scheduled tasks')).toBeInTheDocument();
            expect(screen.getByText('Limited image generation')).toBeInTheDocument();
            expect(screen.queryByText('Limited daily chats')).not.toBeInTheDocument();
        });

        it('keeps the current free features with LumoPlans2026 off', () => {
            renderLumoFree(false);

            expect(screen.getByText('Limited daily chats')).toBeInTheDocument();
            expect(screen.queryByText('Limited messages and chat history')).not.toBeInTheDocument();
        });
    });

    describe('Scribe seat holder', () => {
        const renderScribeSeatHolder = (scribeToLumo: boolean) => {
            mockUseFlag.mockImplementation((flag) => flag === MailFeatureFlag.ScribeToLumo && scribeToLumo);
            renderWithProviders(
                <SubscriptionPanel
                    {...defaultProps}
                    user={buildUser({ isPaid: true, hasPaidMail: true })}
                    subscription={buildSubscription({
                        planName: PLANS.MAIL_PRO,
                        cycle: CYCLE.MONTHLY,
                        currency: 'USD',
                    })}
                    organization={{ MaxMembers: 3, MaxAI: 2, MaxLumo: 1 } as Organization}
                    entitlements={{ ...defaultEntitlements, isB2B: true }}
                />
            );
        };

        const getRow = (text: RegExp) => screen.getByText(text).closest('li') as HTMLElement;

        afterEach(() => {
            mockUseFlag.mockReset();
        });

        it('hides Get more on the Scribe row and keeps it on the Lumo row with ScribeToLumo on', () => {
            renderScribeSeatHolder(true);

            expect(
                within(getRow(/writing assistant for 2 users/)).queryByTestId('get-more-btn')
            ).not.toBeInTheDocument();
            expect(within(getRow(/^Lumo for 1 user/)).getByTestId('get-more-btn')).toBeInTheDocument();
        });

        it('keeps Get more on the Scribe row with ScribeToLumo off', () => {
            renderScribeSeatHolder(false);

            expect(within(getRow(/writing assistant for 2 users/)).getByTestId('get-more-btn')).toBeInTheDocument();
        });
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

    describe('Pass Basic', () => {
        const plansMap = PLANS_MAP as FullPlansMap;
        const passBasic = buildSubscription(
            { planName: PLANS.PASS_BASIC, cycle: CYCLE.MONTHLY, currency: 'CHF' },
            { Amount: 0, BaseRenewAmount: 0 }
        );

        it('shows the free price and "Free forever" with the explore button as the primary action', () => {
            renderWithProviders(
                <SubscriptionPanel
                    {...defaultProps}
                    app={APPS.PROTONPASS}
                    subscription={passBasic}
                    plansMap={plansMap}
                />
            );

            expect(screen.getByTestId('plan-name')).toHaveTextContent('Pass Basic');
            expect(screen.getByText('Free forever')).toBeInTheDocument();
            expect(screen.getByText('/user/month')).toBeInTheDocument();
            expect(screen.getByTestId('explore-other-plan')).toHaveClass('button-solid-norm');
        });

        it('shows "Free forever" before the plans are loaded', () => {
            renderWithProviders(<SubscriptionPanel {...defaultProps} app={APPS.PROTONPASS} subscription={passBasic} />);

            expect(screen.getByText('Free forever')).toBeInTheDocument();
            expect(screen.queryByText('/user/month')).not.toBeInTheDocument();
        });

        it('keeps the other B2B plans unchanged', () => {
            renderWithProviders(
                <SubscriptionPanel
                    {...defaultProps}
                    app={APPS.PROTONPASS}
                    subscription={buildSubscription({
                        planName: PLANS.PASS_BUSINESS,
                        cycle: CYCLE.MONTHLY,
                        currency: 'CHF',
                    })}
                    plansMap={plansMap}
                />
            );

            expect(screen.queryByText('Free forever')).not.toBeInTheDocument();
            expect(screen.queryByText('/user/month')).not.toBeInTheDocument();
            expect(screen.getByTestId('explore-other-plan')).toHaveClass('button-ghost-norm');
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
