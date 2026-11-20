import { render, screen } from '@testing-library/react';

import { usePayments } from '@proton/payments-hooks/ui/context/paymentsContext';
import { CYCLE, PLANS } from '@proton/payments/core/constants';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import type { MultiSubscriptionContext } from '@proton/payments/core/subscription/multi-subscription-context';
import {
    buildLumoSubscription,
    buildMultiSubscriptionContext,
    buildMultiSubscriptionContextFromSubscription,
} from '@proton/payments/testing/buildMultiSubscriptionContext';
import { buildSubscription } from '@proton/payments/testing/buildSubscription';

import SubscriptionCheckoutAddonSection from './SubscriptionCheckoutAddonSection';

vi.mock('@proton/account/entitlementCatalog/hooks', () => ({ useEntitlementCatalog: () => [undefined] }));
vi.mock('@proton/components/hooks/assistant/useAssistantFeatureEnabled', () => ({
    __esModule: true,
    default: () => ({ paymentsEnabled: true }),
}));
vi.mock('@proton/components/containers/payments/planCustomizer/ProtonPlanCustomizer', () => ({
    ProtonPlanCustomizer: ({ latestSubscription }: { latestSubscription: Subscription | undefined }) => (
        <div data-testid="latest-subscription">{latestSubscription?.ID ?? 'no subscription'}</div>
    ),
}));
vi.mock('@proton/payments-hooks/ui/context/paymentsContext', () => ({ usePayments: vi.fn() }));

type PaymentsValue = ReturnType<typeof usePayments>;

const webLumoPlus = buildLumoSubscription(PLANS.LUMO, { ID: 'lumo-plus', Cycle: CYCLE.MONTHLY, Currency: 'CHF' });
const webMailPlus = buildSubscription(
    { planName: PLANS.MAIL, cycle: CYCLE.MONTHLY, currency: 'CHF' },
    { ID: 'mail-plus' }
);
const mailPlusWithUpcomingTerm: Subscription = {
    ...webMailPlus,
    UpcomingSubscription: buildSubscription(
        { planName: PLANS.MAIL, cycle: CYCLE.YEARLY, currency: 'CHF' },
        { ID: 'mail-plus-upcoming' }
    ),
};

const renderAddonSection = (subscription: Subscription, multiSubscriptionContext: MultiSubscriptionContext) => {
    const planIDs = { [PLANS.MAIL]: 1 };
    vi.mocked(usePayments).mockReturnValue({
        subscription,
        multiSubscriptionContext,
        checkoutUi: { planIDs, cycle: CYCLE.YEARLY, currency: 'CHF' },
        plansMap: {},
        selectPlanIDs: vi.fn(),
        telemetryContext: 'subscription-modification',
        loading: false,
        couponConfig: undefined,
    } as unknown as PaymentsValue);

    render(<SubscriptionCheckoutAddonSection />);

    return screen.getByTestId('latest-subscription');
};

describe('SubscriptionCheckoutAddonSection', () => {
    it('starts the add-ons from the upcoming term of the Mail Plus subscription the purchase changes', () => {
        const latestSubscription = renderAddonSection(
            { ...webLumoPlus, SecondarySubscriptions: [mailPlusWithUpcomingTerm] },
            buildMultiSubscriptionContext([webLumoPlus, mailPlusWithUpcomingTerm])
        );

        expect(latestSubscription).toHaveTextContent('mail-plus-upcoming');
    });

    it('starts the add-ons from the upcoming term of the only subscription, as before', () => {
        const latestSubscription = renderAddonSection(
            mailPlusWithUpcomingTerm,
            buildMultiSubscriptionContextFromSubscription(mailPlusWithUpcomingTerm)
        );

        expect(latestSubscription).toHaveTextContent('mail-plus-upcoming');
    });

    it('starts the add-ons from nothing when the purchase starts a new subscription', () => {
        const latestSubscription = renderAddonSection(webLumoPlus, buildMultiSubscriptionContext([webLumoPlus]));

        expect(latestSubscription).toHaveTextContent('no subscription');
    });
});
