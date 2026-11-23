import type { ReactNode } from 'react';

import { renderHook, waitFor } from '@testing-library/react';

import { useMultiSubscriptionContext } from '@proton/payments-hooks/react-extensions/useMultiSubscriptionContext';
import { getOptimisticCheckResult } from '@proton/payments/core/checkout';
import { CYCLE, PLANS } from '@proton/payments/core/constants';
import type { MultiSubscriptionContext } from '@proton/payments/core/subscription/multi-subscription-context';
import {
    buildLumoSubscription,
    buildMultiSubscriptionContext,
    buildMultiSubscriptionContextFromSubscription,
} from '@proton/payments/testing/buildMultiSubscriptionContext';
import { buildSubscription } from '@proton/payments/testing/buildSubscription';
import { getTestPlans, getTestPlansMap } from '@proton/payments/testing/data-plans';
import { APPS } from '@proton/shared/lib/constants';

import { fetchDealPrices } from '../helpers/dealPrices';
import type { OfferConfig } from '../interface';
import { OfferRenewNoticeContext } from '../offerRenewNoticeContext';
import useFetchOffer from './useFetchOffer';

const mockPlans = getTestPlans('CHF');

vi.mock('@proton/account/plans/hooks', () => ({
    usePlans: () => [{ plans: mockPlans }, false],
}));
vi.mock('@proton/app-context/useConfig', () => ({
    useConfig: () => ({ APP_NAME: 'proton-account' }),
}));
vi.mock('@proton/payments-hooks/react-extensions/usePaymentsApi', () => ({
    usePaymentsApiWithCheckFallback: () => ({ paymentsApi: {} }),
}));
vi.mock('@proton/payments-hooks/react-extensions/useMultiSubscriptionContext', () => ({
    useMultiSubscriptionContext: vi.fn(),
}));
vi.mock('../helpers/dealPrices', () => ({
    fetchDealPrices: vi.fn(),
}));

const mockUseMultiSubscriptionContext = vi.mocked(useMultiSubscriptionContext);
const mockFetchDealPrices = vi.mocked(fetchDealPrices);

const webMailPlus = buildSubscription({ planName: PLANS.MAIL, currency: 'CHF', cycle: CYCLE.YEARLY });
const webLumoPlus = buildLumoSubscription(PLANS.LUMO, { Cycle: CYCLE.MONTHLY, Currency: 'CHF' });

const lumoPlusDeal = { planIDs: { [PLANS.LUMO]: 1 }, cycle: CYCLE.YEARLY };
const mailPlusDeal = { planIDs: { [PLANS.MAIL]: 1 }, cycle: CYCLE.YEARLY };
const offerConfig = { deals: [lumoPlusDeal, mailPlusDeal] } as unknown as OfferConfig;

const getCheckResult = (planName: PLANS) =>
    getOptimisticCheckResult({
        cycle: CYCLE.YEARLY,
        planIDs: { [planName]: 1 },
        plansMap: getTestPlansMap('CHF'),
        currency: 'CHF',
    });

const getRenewNoticeSubscriptions = async (multiSubscriptionContext: MultiSubscriptionContext) => {
    mockUseMultiSubscriptionContext.mockReturnValue(multiSubscriptionContext);
    const lumoPlusCheck = getCheckResult(PLANS.LUMO);
    const mailPlusCheck = getCheckResult(PLANS.MAIL);
    mockFetchDealPrices.mockResolvedValue([
        [lumoPlusCheck, lumoPlusCheck, lumoPlusCheck],
        [mailPlusCheck, mailPlusCheck, mailPlusCheck],
    ]);
    const getOfferRenewNotice = vi.fn(() => 'renew');
    const wrapper = ({ children }: { children: ReactNode }) => (
        <OfferRenewNoticeContext.Provider value={getOfferRenewNotice}>{children}</OfferRenewNoticeContext.Provider>
    );

    const { result } = renderHook(() => useFetchOffer({ offerConfig, currency: 'CHF' }), { wrapper });
    await waitFor(() => expect(result.current.offer).toBeDefined());

    expect(mockFetchDealPrices).toHaveBeenCalledWith({}, offerConfig, 'CHF', mockPlans);
    return getOfferRenewNotice.mock.calls.map(([props]: any) => ({
        planIDs: props.planIDs,
        subscription: props.subscription,
        app: props.app,
    }));
};

describe('useFetchOffer renew notice', () => {
    it('builds each deal renew notice from the subscription the deal changes', async () => {
        const calls = await getRenewNoticeSubscriptions(buildMultiSubscriptionContext([webMailPlus, webLumoPlus]));

        expect(calls).toEqual([
            { planIDs: lumoPlusDeal.planIDs, subscription: webLumoPlus, app: APPS.PROTONACCOUNT },
            { planIDs: mailPlusDeal.planIDs, subscription: webMailPlus, app: APPS.PROTONACCOUNT },
        ]);
    });

    it('builds a new Lumo Plus subscription notice without the Mail Plus subscription', async () => {
        const calls = await getRenewNoticeSubscriptions(buildMultiSubscriptionContext([webMailPlus]));

        expect(calls).toEqual([
            { planIDs: lumoPlusDeal.planIDs, subscription: undefined, app: APPS.PROTONACCOUNT },
            { planIDs: mailPlusDeal.planIDs, subscription: webMailPlus, app: APPS.PROTONACCOUNT },
        ]);
    });

    it('keeps the only subscription for every deal', async () => {
        const calls = await getRenewNoticeSubscriptions(buildMultiSubscriptionContextFromSubscription(webMailPlus));

        expect(calls).toEqual([
            { planIDs: lumoPlusDeal.planIDs, subscription: webMailPlus, app: APPS.PROTONACCOUNT },
            { planIDs: mailPlusDeal.planIDs, subscription: webMailPlus, app: APPS.PROTONACCOUNT },
        ]);
    });
});
