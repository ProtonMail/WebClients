import { screen } from '@testing-library/react';

import { useEntitlementCatalog } from '@proton/account/entitlementCatalog/hooks';
import { getModelState } from '@proton/account/testing/getModelState';
import { userDefault } from '@proton/components/hooks/helpers/tests/useUser';
import { renderWithProviders } from '@proton/components/testing/renderWithProviders';
import { useMultiSubscriptionContext } from '@proton/payments-hooks/react-extensions/useMultiSubscriptionContext';
import { CYCLE, DEFAULT_CYCLE, PLANS } from '@proton/payments/core/constants';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import type { MultiSubscriptionContext } from '@proton/payments/core/subscription/multi-subscription-context';
import {
    buildLumoSubscription,
    buildMultiSubscriptionContext,
    buildMultiSubscriptionContextFromSubscription,
} from '@proton/payments/testing/buildMultiSubscriptionContext';
import { buildSubscription } from '@proton/payments/testing/buildSubscription';
import { getSubscriptionState } from '@proton/payments/testing/redux-state';
import { APPS, type APP_NAMES } from '@proton/shared/lib/constants';

import PlansSection from './PlansSection';

vi.mock('@proton/components/containers/payments/subscription/PlanSelection', () => ({
    __esModule: true,
    default: ({ cycle }: { cycle: number }) => <div data-testid="plan-selection" data-cycle={cycle} />,
}));
vi.mock('../../ui/context/PaymentContext', () => ({
    PaymentsContextProvider: ({ children }: { children: any }) => children,
}));
vi.mock('@proton/account/entitlementCatalog/hooks', () => ({
    useEntitlementCatalog: vi.fn(() => [undefined, false]),
}));
vi.mock('@proton/payments-hooks/react-extensions/useMultiSubscriptionContext', () => ({
    useMultiSubscriptionContext: vi.fn(),
}));
vi.mock('@proton/payments-hooks/react-extensions/usePaymentsApi', () => ({
    usePaymentsApi: () => ({ paymentsApi: {} }),
}));
vi.mock('@proton/payments-hooks/client-extensions/useAutomaticCurrency', () => ({
    useAutomaticCurrency: () => ['CHF', false],
}));
vi.mock('@proton/components/containers/payments/subscription/subscriptionModalContext', async () => ({
    ...(await vi.importActual<object>('@proton/components/containers/payments/subscription/subscriptionModalContext')),
    useSubscriptionModal: () => [vi.fn(), false],
}));
vi.mock('./plansSectionTelemetry', () => ({
    usePlansSectionTelemetry: () => ({
        sendPageLoad: vi.fn(),
        sendCtaClick: vi.fn(),
        sendSubscriptionSuccess: vi.fn(),
    }),
}));

const mockUseMultiSubscriptionContext = vi.mocked(useMultiSubscriptionContext);
const mockUseEntitlementCatalog = vi.mocked(useEntitlementCatalog);

const webMailPlus = buildSubscription({ planName: PLANS.MAIL, currency: 'CHF', cycle: CYCLE.YEARLY });
const webLumoPlus = buildLumoSubscription(PLANS.LUMO, { Cycle: CYCLE.MONTHLY, Currency: 'CHF' });

const renderPlansSection = ({
    app,
    loadedSubscription,
    multiSubscriptionContext,
}: {
    app: APP_NAMES;
    loadedSubscription: Subscription;
    multiSubscriptionContext: MultiSubscriptionContext;
}) => {
    mockUseMultiSubscriptionContext.mockReturnValue(multiSubscriptionContext);

    renderWithProviders(<PlansSection app={app} />, {
        preloadedState: {
            user: getModelState(userDefault),
            subscription: getSubscriptionState(loadedSubscription),
        },
    });

    return Number(screen.getByTestId('plan-selection').getAttribute('data-cycle'));
};

describe('PlansSection default cycle', () => {
    const mailPlusAndLumoPlus = { ...webMailPlus, SecondarySubscriptions: [webLumoPlus] };

    it('defaults the Lumo plans page to the monthly cycle of Lumo Plus, not the yearly cycle of Mail Plus', () => {
        const cycle = renderPlansSection({
            app: APPS.PROTONLUMO,
            loadedSubscription: mailPlusAndLumoPlus,
            multiSubscriptionContext: buildMultiSubscriptionContext([webMailPlus, webLumoPlus]),
        });

        expect(cycle).toBe(CYCLE.MONTHLY);
    });

    it('defaults the Mail plans page to the yearly cycle of Mail Plus', () => {
        const cycle = renderPlansSection({
            app: APPS.PROTONMAIL,
            loadedSubscription: mailPlusAndLumoPlus,
            multiSubscriptionContext: buildMultiSubscriptionContext([webMailPlus, webLumoPlus]),
        });

        expect(cycle).toBe(CYCLE.YEARLY);
    });

    it('defaults to the default cycle when Lumo Plus would be a new subscription next to Mail Plus', () => {
        const webMailPlusMonthly = buildSubscription({ planName: PLANS.MAIL, currency: 'CHF', cycle: CYCLE.MONTHLY });

        const cycle = renderPlansSection({
            app: APPS.PROTONLUMO,
            loadedSubscription: webMailPlusMonthly,
            multiSubscriptionContext: buildMultiSubscriptionContext([webMailPlusMonthly]),
        });

        expect(cycle).toBe(DEFAULT_CYCLE);
    });

    it('keeps the cycle of the only subscription', () => {
        const webMailPlusMonthly = buildSubscription({ planName: PLANS.MAIL, currency: 'CHF', cycle: CYCLE.MONTHLY });

        const cycle = renderPlansSection({
            app: APPS.PROTONLUMO,
            loadedSubscription: webMailPlusMonthly,
            multiSubscriptionContext: buildMultiSubscriptionContextFromSubscription(webMailPlusMonthly),
        });

        expect(cycle).toBe(CYCLE.MONTHLY);
    });
});

describe('PlansSection while the entitlement catalog loads', () => {
    it('waits for the entitlement catalog before choosing the cycle and plans', () => {
        mockUseEntitlementCatalog.mockReturnValueOnce([undefined, true]);
        mockUseMultiSubscriptionContext.mockReturnValue(buildMultiSubscriptionContextFromSubscription(webMailPlus));

        renderWithProviders(<PlansSection app={APPS.PROTONMAIL} />, {
            preloadedState: {
                user: getModelState(userDefault),
                subscription: getSubscriptionState(webMailPlus),
            },
        });

        expect(screen.queryByTestId('plan-selection')).toBeNull();
    });
});
