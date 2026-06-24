import { fireEvent, screen, waitFor } from '@testing-library/react';

import { getModelState } from '@proton/account/test';
import { SUBSCRIPTION_STEPS } from '@proton/components/containers/payments/subscription/constants';
import type { useCurrencies } from '@proton/components/payments/client-extensions/useCurrencies';
import type { PaymentStatus, Subscription } from '@proton/payments';
import {
    CURRENCIES,
    CYCLE,
    DEFAULT_CYCLE,
    FREE_PLAN,
    PLANS,
    getPlanName,
    getPreferredCurrency,
} from '@proton/payments';
import { buildSubscription } from '@proton/testing/builders/subscription';
import { getLongTestPlans } from '@proton/testing/data/payments/data-plans';
import { renderWithProviders } from '@proton/testing/lib/context/renderWithProviders';
import { getPaymentStatusState, getSubscriptionState } from '@proton/testing/lib/initialReduxState';

import { userDefault } from '../../../hooks/helpers/test';
import AutomaticSubscriptionModal, { getParameters } from './AutomaticSubscriptionModal';
import { getEligibility } from './subscriptionEligbility';

const plans = getLongTestPlans();
const paymentStatus: PaymentStatus = {
    CountryCode: 'CH',
    State: null,
    VendorStates: { Card: true, Paypal: true, Apple: true, Cash: true, Bitcoin: true, Google: true },
};

const getPreferredCurrencyHook = (params: Parameters<ReturnType<typeof useCurrencies>['getPreferredCurrency']>[0]) =>
    getPreferredCurrency({ ...params, enableNewBatchCurrencies: true });

const callGetParameters = (search: string, overrides: { subscription?: any } = {}) => {
    const subscription =
        overrides.subscription ?? buildSubscription({ planName: PLANS.BUNDLE, currency: 'CHF', cycle: CYCLE.YEARLY });

    return getParameters(search, plans, subscription, userDefault, getPreferredCurrencyHook, paymentStatus);
};

describe('getParameters', () => {
    describe('plan resolution', () => {
        it('resolves the plan from the `plan` param', () => {
            const { plan } = callGetParameters('?plan=mail2022');
            expect(plan?.Name).toBe(PLANS.MAIL);
        });

        it('returns no plan when the `plan` param is missing', () => {
            const { plan } = callGetParameters('');
            expect(plan).toBeUndefined();
        });

        it('returns no plan when the `plan` param is unknown', () => {
            const { plan } = callGetParameters('?plan=does-not-exist');
            expect(plan).toBeUndefined();
        });

        it('falls back to the subscription plan when addon=lumo and no plan param', () => {
            const subscription = buildSubscription({ planName: PLANS.BUNDLE, currency: 'CHF', cycle: CYCLE.YEARLY });
            const { plan } = callGetParameters('?addon=lumo', { subscription });
            expect(plan?.Name).toBe(getPlanName(subscription));
        });

        it('falls back to the subscription plan when addon=meet and no plan param', () => {
            const subscription = buildSubscription({ planName: PLANS.BUNDLE, currency: 'CHF', cycle: CYCLE.YEARLY });
            const { plan } = callGetParameters('?addon=meet', { subscription });
            expect(plan?.Name).toBe(getPlanName(subscription));
        });
    });

    describe('cycle resolution', () => {
        it('uses a valid `cycle` param', () => {
            const { cycle } = callGetParameters('?plan=mail2022&cycle=24');
            expect(cycle).toBe(CYCLE.TWO_YEARS);
        });

        it('ignores an invalid `cycle` param and falls back to min(subscription.Cycle, DEFAULT_CYCLE)', () => {
            const subscription = buildSubscription({ planName: PLANS.BUNDLE, currency: 'CHF', cycle: CYCLE.MONTHLY });
            const { cycle } = callGetParameters('?plan=mail2022&cycle=7', { subscription });
            expect(cycle).toBe(CYCLE.MONTHLY);
        });

        it('caps the subscription cycle at DEFAULT_CYCLE when no `cycle` param', () => {
            const subscription = buildSubscription({ planName: PLANS.BUNDLE, currency: 'CHF', cycle: CYCLE.TWO_YEARS });
            const { cycle } = callGetParameters('?plan=mail2022', { subscription });
            expect(cycle).toBe(DEFAULT_CYCLE);
        });

        it('parses minimumCycle and maximumCycle', () => {
            const { minimumCycle, maximumCycle } = callGetParameters('?plan=mail2022&minimumCycle=12&maximumCycle=24');
            expect(minimumCycle).toBe(CYCLE.YEARLY);
            expect(maximumCycle).toBe(CYCLE.TWO_YEARS);
        });

        it('drops an invalid minimumCycle/maximumCycle', () => {
            const { minimumCycle, maximumCycle } = callGetParameters('?plan=mail2022&minimumCycle=7&maximumCycle=99');
            expect(minimumCycle).toBeUndefined();
            expect(maximumCycle).toBeUndefined();
        });
    });

    describe('currency resolution', () => {
        it('returns a valid uppercased `currency` param', () => {
            const { currency } = callGetParameters('?plan=mail2022&currency=eur');
            expect(currency).toBe('EUR');
            expect(CURRENCIES).toContain(currency);
        });

        it('returns undefined for an unsupported currency', () => {
            const { currency } = callGetParameters('?plan=mail2022&currency=XYZ');
            expect(currency).toBeUndefined();
        });
    });

    describe('step (target) resolution', () => {
        it('maps target=compare to PLAN_SELECTION', () => {
            const { step } = callGetParameters('?plan=mail2022&target=compare');
            expect(step).toBe(SUBSCRIPTION_STEPS.PLAN_SELECTION);
        });

        it('maps target=checkout to CHECKOUT', () => {
            const { step } = callGetParameters('?plan=mail2022&target=checkout');
            expect(step).toBe(SUBSCRIPTION_STEPS.CHECKOUT);
        });

        it('defaults to CHECKOUT when no/unknown target', () => {
            expect(callGetParameters('?plan=mail2022').step).toBe(SUBSCRIPTION_STEPS.CHECKOUT);
            expect(callGetParameters('?plan=mail2022&target=nope').step).toBe(SUBSCRIPTION_STEPS.CHECKOUT);
        });
    });

    describe('coupon', () => {
        it('passes the coupon through', () => {
            expect(callGetParameters('?plan=mail2022&coupon=BF2026').coupon).toBe('BF2026');
        });

        it('is undefined when absent', () => {
            expect(callGetParameters('?plan=mail2022').coupon).toBeUndefined();
        });
    });

    describe('disablePlanSelection', () => {
        it.each([
            ['type=offer', '?plan=mail2022&type=offer'],
            ['edit=disable', '?plan=mail2022&edit=disable'],
            ['addon=lumo', '?addon=lumo'],
            ['addon=meet', '?addon=meet'],
        ])('is true for %s', (_label, search) => {
            expect(callGetParameters(search).disablePlanSelection).toBe(true);
        });

        it('is false by default', () => {
            expect(callGetParameters('?plan=mail2022').disablePlanSelection).toBe(false);
        });
    });

    describe('disableCycleSelector', () => {
        it.each([
            ['type=offer', '?plan=mail2022&type=offer'],
            ['offer present', '?plan=mail2022&offer=anything'],
            ['addon=lumo', '?addon=lumo'],
            ['addon=meet', '?addon=meet'],
        ])('is true for %s', (_label, search) => {
            expect(callGetParameters(search).disableCycleSelector).toBe(true);
        });

        it('edit=enable forces it false even when type=offer', () => {
            expect(callGetParameters('?plan=mail2022&type=offer&edit=enable').disableCycleSelector).toBe(false);
        });

        it('is false by default', () => {
            expect(callGetParameters('?plan=mail2022').disableCycleSelector).toBe(false);
        });
    });
});

jest.mock('@proton/components/hooks/useModals');
jest.mock('@proton/components/components/portal/Portal');
jest.mock('./subscriptionEligbility');

const mockOpenSubscriptionModal = jest.fn();
jest.mock('@proton/components/containers/payments/subscription/SubscriptionModalProvider', () => ({
    useSubscriptionModal: () => [mockOpenSubscriptionModal, false],
}));

const mockedGetEligibility = getEligibility as jest.Mock;

const renderModal = (search: string, subscriptionOverride?: Subscription) => {
    const subscription =
        subscriptionOverride ?? buildSubscription({ planName: PLANS.BUNDLE, currency: 'CHF', cycle: CYCLE.YEARLY });

    return renderWithProviders(<AutomaticSubscriptionModal />, {
        // Starts the router at this URL so the component reads `search` from useLocation on first render.
        initialUrl: `/${search}`,
        preloadedState: {
            user: getModelState(userDefault),
            subscription: getSubscriptionState(subscription),
            paymentStatus: getPaymentStatusState(paymentStatus),
            plans: getModelState({ plans, freePlan: FREE_PLAN }),
        },
    });
};

describe('<AutomaticSubscriptionModal />', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockedGetEligibility.mockReturnValue({ type: 'pass-through' });
    });

    it('opens the subscription modal with the mapped props on pass-through', async () => {
        renderModal('?plan=mail2022&cycle=24&coupon=BF&currency=eur&target=checkout');

        await waitFor(() => expect(mockOpenSubscriptionModal).toHaveBeenCalledTimes(1));

        expect(mockOpenSubscriptionModal).toHaveBeenCalledWith(
            expect.objectContaining({
                plan: PLANS.MAIL,
                cycle: CYCLE.TWO_YEARS,
                coupon: 'BF',
                currency: 'EUR',
                step: SUBSCRIPTION_STEPS.CHECKOUT,
                disablePlanSelection: false,
                disableCycleSelector: false,
            })
        );
    });

    it('does not open the modal when no plan resolves', async () => {
        renderModal('?plan=does-not-exist');
        await new Promise((r) => setTimeout(r, 0));
        expect(mockOpenSubscriptionModal).not.toHaveBeenCalled();
    });

    it('does not open the modal when not eligible', async () => {
        mockedGetEligibility.mockReturnValue({ type: 'not-eligible' });
        renderModal('?plan=mail2022');
        await screen.findByText(/this offer is not available/i);
        expect(mockOpenSubscriptionModal).not.toHaveBeenCalled();
    });

    it('does not open the modal directly on bf-applied', async () => {
        mockedGetEligibility.mockReturnValue({ type: 'bf-applied' });
        renderModal('?plan=mail2022');
        await screen.findByText(/successfully updated with this promotion/i);
        expect(mockOpenSubscriptionModal).not.toHaveBeenCalled();
    });

    it('opens the modal with the upsell plan combination only after confirmation', async () => {
        mockedGetEligibility.mockReturnValue({
            type: 'upsell',
            discount: 20,
            planCombination: { plan: { Name: PLANS.BUNDLE, Title: 'Proton Unlimited' }, cycle: CYCLE.YEARLY },
        });
        renderModal('?plan=mail2022');

        const getDeal = await screen.findByText(/get the deal/i);
        expect(mockOpenSubscriptionModal).not.toHaveBeenCalled();

        fireEvent.click(getDeal);
        await waitFor(() => expect(mockOpenSubscriptionModal).toHaveBeenCalledTimes(1));
        expect(mockOpenSubscriptionModal).toHaveBeenCalledWith(
            expect.objectContaining({ plan: PLANS.BUNDLE, cycle: CYCLE.YEARLY })
        );
    });

    it('sets lumo addon planIDs and clears plan on pass-through', async () => {
        renderModal('?addon=lumo');

        await waitFor(() => expect(mockOpenSubscriptionModal).toHaveBeenCalledTimes(1));
        const props = mockOpenSubscriptionModal.mock.calls[0][0];
        expect(props.plan).toBeUndefined();
        expect(props.planIDs).toBeDefined();
        expect(typeof props.onSubscribed).toBe('function');
    });
});
