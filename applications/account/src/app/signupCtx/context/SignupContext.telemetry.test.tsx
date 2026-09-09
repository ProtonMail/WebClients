import { type ReactNode, useEffect } from 'react';

import { render, waitFor } from '@testing-library/react';

import { getModelState } from '@proton/account/testing/getModelState';
import { PLANS } from '@proton/payments/core/constants';
import type { PaymentsApi } from '@proton/payments/core/interface';
import { FREE_PLAN } from '@proton/payments/core/subscription/freePlans';
import type { SubscriptionEstimation } from '@proton/payments/core/subscription/interface';
import { getLongTestPlans } from '@proton/payments/testing/data-plans';
import {
    PaymentsContextOptimisticProvider,
    usePaymentOptimistic,
} from '@proton/payments-ui/ui/context/PaymentContextOptimistic';
import { telemetry } from '@proton/shared/lib/telemetry';
import { addApiMock, clearApiMocks } from '@proton/testing/lib/api';
import { getStoreWrapper } from '@proton/testing/lib/context/renderWithProviders';

import { SignupType } from '../../signup/interfaces';
import { SignupContextProvider } from './SignupContext';

const checkSubscription = jest.fn();

jest.mock('@proton/components/payments/react-extensions/usePaymentsApi', () => {
    const paymentsApi = {
        checkSubscription: (...args: any[]) => checkSubscription(...args),
        cacheMultiCheck: jest.fn(),
        multiCheck: jest.fn().mockResolvedValue([]),
        getFullBillingAddress: jest.fn().mockResolvedValue({}),
    } as unknown as PaymentsApi;

    return {
        usePaymentsApi: () => ({ paymentsApi, getPaymentsApi: () => paymentsApi }),
    };
});

const buildCheckResult = (): SubscriptionEstimation =>
    ({
        Amount: 11988,
        AmountDue: 11988,
        Currency: 'CHF',
        Cycle: 12,
        Proration: 0,
        CouponDiscount: 0,
        Credit: 0,
        Coupon: null,
        Gift: 0,
        Taxes: [],
        TaxInclusive: 1,
        PeriodEnd: 0,
        RenewCycle: 12,
        SubscriptionMode: 0,
        BaseRenewAmount: null,
        RenewDiscount: 0,
        optimistic: false,
        requestData: { Plans: { [PLANS.BUNDLE]: 1 }, Currency: 'CHF', Cycle: 12 },
    }) as unknown as SubscriptionEstimation;

/**
 * Mirrors how the referral flow registers its trial resolver: from the component that renders the signup provider,
 * so that the registration and the initialization event race the same way they do in production.
 */
const WithTrialResolver = ({ isTrial, children }: { isTrial: boolean; children: ReactNode }) => {
    const payments = usePaymentOptimistic();

    useEffect(() => {
        payments.setIsTrialResolver(() => isTrial);

        return () => payments.setIsTrialResolver(undefined);
    }, []);

    return <>{children}</>;
};

const renderReferralSignupContext = ({ isTrial }: { isTrial?: boolean } = {}) => {
    const { Wrapper } = getStoreWrapper({
        preloadedState: { plans: getModelState({ plans: getLongTestPlans('CHF'), freePlan: FREE_PLAN }) },
    });

    const signupProvider = (
        <SignupContextProvider
            app="generic"
            flowId="referral-generic"
            loginUrl="/login"
            productParam="generic"
            onStartAuth={async () => {}}
            onLogin={async () => {}}
            handleLogin={async () => ({ state: 'complete' }) as const}
            paymentsDataConfig={{
                plan: { planIDs: { [PLANS.BUNDLE]: 1 }, cycle: 12, currency: 'CHF' },
                telemetryContext: 'ctx-signup-referral',
            }}
            accountFormDataConfig={{ availableSignupTypes: new Set([SignupType.Proton]) }}
        >
            <div />
        </SignupContextProvider>
    );

    return render(
        <Wrapper>
            <PaymentsContextOptimisticProvider preload={false} authenticated={false}>
                {isTrial === undefined ? (
                    signupProvider
                ) : (
                    <WithTrialResolver isTrial={isTrial}>{signupProvider}</WithTrialResolver>
                )}
            </PaymentsContextOptimisticProvider>
        </Wrapper>
    );
};

describe('signup context telemetry', () => {
    let sendCustomEvent: jest.SpyInstance;

    beforeEach(() => {
        jest.clearAllMocks();
        addApiMock('domains/available', () => ({ Domains: ['proton.me'] }));
        checkSubscription.mockResolvedValue(buildCheckResult());
        sendCustomEvent = jest.spyOn(telemetry, 'sendCustomEvent').mockImplementation(() => {});
    });

    afterEach(() => {
        clearApiMocks();
        sendCustomEvent.mockRestore();
    });

    const getEventNames = () => sendCustomEvent.mock.calls.map(([eventName]) => eventName);

    const getInitPayload = () => sendCustomEvent.mock.calls.find(([name]) => name === 'ctx_signup_referral_init')![1];

    it('reports the initialization event against the flow telemetry context', async () => {
        renderReferralSignupContext();

        await waitFor(() => expect(getEventNames()).toContain('ctx_signup_referral_init'));
        expect(getEventNames()).not.toContain('other_init');
    });

    it('reports the initialization event exactly once', async () => {
        renderReferralSignupContext();

        await waitFor(() => expect(getEventNames()).toContain('ctx_signup_referral_init'));
        expect(getEventNames().filter((name) => name === 'ctx_signup_referral_init')).toHaveLength(1);
    });

    it('reports the selected plan and cycle on the initialization event', async () => {
        renderReferralSignupContext();

        await waitFor(() => expect(getEventNames()).toContain('ctx_signup_referral_init'));

        const payload = getInitPayload();
        expect(payload.selectedPlanName).toBe(PLANS.BUNDLE);
        expect(payload.selectedCycle).toBe(12);
        expect(payload.selectedCurrency).toBe('CHF');
    });

    it('reports isTrial false when the flow registers no trial resolver', async () => {
        renderReferralSignupContext();

        await waitFor(() => expect(getEventNames()).toContain('ctx_signup_referral_init'));
        expect(getInitPayload().isTrial).toBe(false);
    });

    it('reports the trial resolved by the flow, which registers it above the signup provider', async () => {
        renderReferralSignupContext({ isTrial: true });

        await waitFor(() => expect(getEventNames()).toContain('ctx_signup_referral_init'));
        expect(getInitPayload().isTrial).toBe(true);
    });
});
