import { fireEvent, screen, waitFor } from '@testing-library/react';

import { getModelState } from '@proton/account/tests';
import {
    ADDON_PREFIXES,
    CURRENCIES,
    CYCLE,
    DEFAULT_CYCLE,
    DEFAULT_PAYMENT_VENDOR_STATES,
    PLANS,
} from '@proton/payments/core/constants';
import { getPreferredCurrency } from '@proton/payments/core/currencies';
import type { PaymentStatus } from '@proton/payments/core/interface';
import { getAddonNameByPlan } from '@proton/payments/core/plan/helpers';
import { FREE_PLAN } from '@proton/payments/core/subscription/freePlans';
import { getPlanName } from '@proton/payments/core/subscription/helpers';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import { buildSubscription } from '@proton/payments/testing/buildSubscription';
import { getLongTestPlans } from '@proton/payments/testing/data-plans';
import { renderWithProviders } from '@proton/testing/lib/context/renderWithProviders';
import { getPaymentStatusState, getSubscriptionState } from '@proton/testing/lib/initialReduxState';

import { userDefault } from '../../../hooks/helpers/tests';
import type { useCurrencies } from '../../../payments/client-extensions/useCurrencies';
import AutomaticSubscriptionModal, { getGenericNameFromPrefix, getParameters } from './AutomaticSubscriptionModal';
import { SUBSCRIPTION_STEPS } from './constants';
import { getEligibility } from './subscriptionEligbility';

const plans = getLongTestPlans();
const paymentStatus: PaymentStatus = {
    CountryCode: 'CH',
    State: null,
    VendorStates: DEFAULT_PAYMENT_VENDOR_STATES,
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
            const { preferredCurrency } = callGetParameters('?plan=mail2022&currency=eur');

            expect(preferredCurrency).toBe('EUR');
            expect(CURRENCIES).toContain(preferredCurrency);
        });

        it('returns fallback for an unsupported currency', () => {
            const { preferredCurrency } = callGetParameters('?plan=mail2022&currency=XYZ');

            expect(preferredCurrency).toBe('CHF');
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

    describe('totalX params', () => {
        it.each(Object.entries(ADDON_PREFIXES))(
            'total%s is ignored when missing plan',
            (_, addonPrefix: ADDON_PREFIXES) => {
                const addon = getGenericNameFromPrefix(addonPrefix);
                const result = callGetParameters(`?total${addon}=1`);

                expect(result.totals).not.toHaveProperty(addonPrefix);
            }
        );

        it.each(Object.entries(ADDON_PREFIXES))(
            'total%s is present when plan defined',
            (_, addonPrefix: ADDON_PREFIXES) => {
                const addon = getGenericNameFromPrefix(addonPrefix);
                const result = callGetParameters(`?plan=mail2022&total${addon}=1`);

                expect(result.totals).toHaveProperty(addonPrefix);
            }
        );

        describe('validation and clamping', () => {
            it('drops non-numeric values', () => {
                const result = callGetParameters('?plan=mail2022&totalMember=abc&totalIp=xyz');
                expect(result.totals).toEqual({});
            });

            it('drops zero values', () => {
                const result = callGetParameters('?plan=mail2022&totalMember=0&totalIp=0');
                expect(result.totals).toEqual({});
            });

            it('drops negative values', () => {
                const result = callGetParameters('?plan=mail2022&totalMember=-5&totalIp=-3');
                expect(result.totals).toEqual({});
            });

            it('keeps valid values while dropping invalid ones', () => {
                const result = callGetParameters(
                    '?plan=mail2022&totalMember=5&totalIp=abc&totalDomain=0&totalScribe=-2&totalLumo=3'
                );
                expect(result.totals).toEqual({
                    [ADDON_PREFIXES.MEMBER]: 5,
                    [ADDON_PREFIXES.LUMO]: 3,
                });
            });

            it('threat floating number values as integer correctly', () => {
                const result = callGetParameters('?plan=mail2022&totalMember=5.5&totalIp=3.7');
                expect(result.totals).toEqual({
                    [ADDON_PREFIXES.MEMBER]: 5,
                    [ADDON_PREFIXES.IP]: 3,
                });
            });
        });
    });
});

jest.mock('../../../hooks/useModals');
jest.mock('@proton/atoms/Portal/Portal');
jest.mock('./subscriptionEligbility');

const mockOpenSubscriptionModal = jest.fn();
jest.mock('./SubscriptionModalProvider', () => ({
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

    describe('total* addon params', () => {
        const memberAddonName = getAddonNameByPlan(ADDON_PREFIXES.MEMBER, PLANS.BUNDLE_PRO_2024) as string;
        const ipAddonName = getAddonNameByPlan(ADDON_PREFIXES.IP, PLANS.BUNDLE_PRO_2024) as string;
        const domainAddonName = getAddonNameByPlan(ADDON_PREFIXES.DOMAIN, PLANS.BUNDLE_PRO_2024) as string;
        const scribeAddonName = getAddonNameByPlan(ADDON_PREFIXES.SCRIBE, PLANS.BUNDLE_PRO_2024) as string;
        const lumoAddonName = getAddonNameByPlan(ADDON_PREFIXES.LUMO, PLANS.BUNDLE_PRO_2024) as string;

        it('applies totalMember/totalIp/totalDomain/totalScribe/totalLumo by adding the matching addons and clearing plan', async () => {
            renderModal('?plan=bundlepro2024&totalMember=5&totalIp=3&totalDomain=20&totalScribe=3&totalLumo=2');

            await waitFor(() => expect(mockOpenSubscriptionModal).toHaveBeenCalledTimes(1));
            const props = mockOpenSubscriptionModal.mock.calls[0][0];

            expect(props.plan).toBeUndefined();
            expect(props.planIDs).toEqual({
                [PLANS.BUNDLE_PRO_2024]: 1,
                [memberAddonName]: 4,
                [ipAddonName]: 3,
                [domainAddonName]: 5,
                [scribeAddonName]: 3,
                [lumoAddonName]: 2,
            });
        });

        it('applies totalMeet by adding the meet addon and clearing plan', async () => {
            renderModal('?plan=mailpro2022&totalMeet=1');

            await waitFor(() => expect(mockOpenSubscriptionModal).toHaveBeenCalledTimes(1));
            const props = mockOpenSubscriptionModal.mock.calls[0][0];

            const meetAddonName = getAddonNameByPlan(ADDON_PREFIXES.MEET, PLANS.MAIL_PRO) as string;

            expect(props.plan).toBeUndefined();
            expect(props.planIDs).toEqual({
                [PLANS.MAIL_PRO]: 1,
                [meetAddonName]: 1,
            });
        });

        it('only applies the totalX params that are present, ignoring the rest', async () => {
            renderModal('?plan=bundlepro2024&totalScribe=1&addon=lumo');

            await waitFor(() => expect(mockOpenSubscriptionModal).toHaveBeenCalledTimes(1));
            const props = mockOpenSubscriptionModal.mock.calls[0][0];

            expect(props.plan).toBeUndefined();
            expect(props.planIDs).toEqual({
                [PLANS.BUNDLE_PRO_2024]: 1,
                [scribeAddonName]: 1,
            });
        });

        it('ignores invalid totalX params (zero, negative, non-numeric)', async () => {
            renderModal('?plan=bundlepro2024&totalMember=0&totalIp=-5&totalDomain=abc&totalScribe=1');

            await waitFor(() => expect(mockOpenSubscriptionModal).toHaveBeenCalledTimes(1));
            const props = mockOpenSubscriptionModal.mock.calls[0][0];

            expect(props.plan).toBeUndefined();
            expect(props.planIDs).toEqual({
                [PLANS.BUNDLE_PRO_2024]: 1,
                [scribeAddonName]: 1,
            });
        });

        it('handles mixed valid and invalid totalX params', async () => {
            renderModal(
                '?plan=bundlepro2024&totalMember=5&totalIp=abc&totalDomain=20&totalScribe=0&totalLumo=-2&totalMeet=4'
            );

            await waitFor(() => expect(mockOpenSubscriptionModal).toHaveBeenCalledTimes(1));
            const props = mockOpenSubscriptionModal.mock.calls[0][0];

            expect(props.plan).toBeUndefined();
            // Should apply totalMember=5 and totalDomain=20
            // totalIp=abc (invalid), totalScribe=0 (invalid), totalLumo=-2 (invalid), totalMeet=4 (unsupported by plan)

            expect(props.planIDs).toEqual({
                [PLANS.BUNDLE_PRO_2024]: 1,
                [memberAddonName]: 4,
                [domainAddonName]: 5,
            });
        });

        it('clamps per-seat addons to member total when exceeding', async () => {
            renderModal('?plan=bundlepro2024&totalLumo=5');

            await waitFor(() => expect(mockOpenSubscriptionModal).toHaveBeenCalledTimes(1));
            const props = mockOpenSubscriptionModal.mock.calls[0][0];

            expect(props.plan).toBeUndefined();
            expect(props.planIDs[PLANS.BUNDLE_PRO_2024]).toBe(1);
            expect(props.planIDs[lumoAddonName]).toBeDefined();
            expect(props.planIDs[lumoAddonName]).toBe(1);
        });

        it('allows explicit member count with matching lumo count', async () => {
            renderModal('?plan=bundlepro2024&totalMember=5&totalLumo=5');

            await waitFor(() => expect(mockOpenSubscriptionModal).toHaveBeenCalledTimes(1));
            const props = mockOpenSubscriptionModal.mock.calls[0][0];

            expect(props.plan).toBeUndefined();
            expect(props.planIDs).toEqual({
                [PLANS.BUNDLE_PRO_2024]: 1,
                [memberAddonName]: 4,
                [lumoAddonName]: 5,
            });
        });

        it('use lumo instead of scribe params and balance', async () => {
            renderModal('?plan=bundlepro2024&totalMember=5&totalLumo=5&totalScribe=5');

            await waitFor(() => expect(mockOpenSubscriptionModal).toHaveBeenCalledTimes(1));
            const props = mockOpenSubscriptionModal.mock.calls[0][0];

            expect(props.plan).toBeUndefined();
            expect(props.planIDs).toEqual({
                [PLANS.BUNDLE_PRO_2024]: 1,
                [memberAddonName]: 4,
                [lumoAddonName]: 5,
            });
        });
        it('cap lumo and scribe params and balance', async () => {
            renderModal('?plan=bundlepro2024&totalMember=5&totalLumo=2&totalScribe=5');

            await waitFor(() => expect(mockOpenSubscriptionModal).toHaveBeenCalledTimes(1));
            const props = mockOpenSubscriptionModal.mock.calls[0][0];

            expect(props.plan).toBeUndefined();
            expect(props.planIDs).toEqual({
                [PLANS.BUNDLE_PRO_2024]: 1,
                [memberAddonName]: 4,
                [lumoAddonName]: 2,
                [scribeAddonName]: 3,
            });
        });

        describe('edge cases for vpnpro2023 and vpnbiz2023 member counts', () => {
            const vpnProMemberAddonName = getAddonNameByPlan(ADDON_PREFIXES.MEMBER, PLANS.VPN_PRO) as string;
            const vpnBizMemberAddonName = getAddonNameByPlan(ADDON_PREFIXES.MEMBER, PLANS.VPN_BUSINESS) as string;

            it('vpnpro2023: totalMember=1 clamps to base 2 without addons', async () => {
                renderModal('?plan=vpnpro2023&totalMember=1');

                await waitFor(() => expect(mockOpenSubscriptionModal).toHaveBeenCalledTimes(1));
                const props = mockOpenSubscriptionModal.mock.calls[0][0];

                expect(props.plan).toBeUndefined();
                expect(props.planIDs).toEqual({
                    [PLANS.VPN_PRO]: 1,
                });
            });

            it('vpnpro2023: totalMember=2 matches base without addons', async () => {
                renderModal('?plan=vpnpro2023&totalMember=2');

                await waitFor(() => expect(mockOpenSubscriptionModal).toHaveBeenCalledTimes(1));
                const props = mockOpenSubscriptionModal.mock.calls[0][0];

                expect(props.plan).toBeUndefined();
                expect(props.planIDs).toEqual({
                    [PLANS.VPN_PRO]: 1,
                });
            });

            it('vpnpro2023: totalMember=3 adds 1 member addon', async () => {
                renderModal('?plan=vpnpro2023&totalMember=3');

                await waitFor(() => expect(mockOpenSubscriptionModal).toHaveBeenCalledTimes(1));
                const props = mockOpenSubscriptionModal.mock.calls[0][0];

                expect(props.plan).toBeUndefined();
                expect(props.planIDs).toEqual({
                    [PLANS.VPN_PRO]: 1,
                    [vpnProMemberAddonName]: 1,
                });
            });

            it('vpnbiz2023: totalMember=1 clamps to base 2 without addons', async () => {
                renderModal('?plan=vpnbiz2023&totalMember=1');

                await waitFor(() => expect(mockOpenSubscriptionModal).toHaveBeenCalledTimes(1));
                const props = mockOpenSubscriptionModal.mock.calls[0][0];

                expect(props.plan).toBeUndefined();
                expect(props.planIDs).toEqual({
                    [PLANS.VPN_BUSINESS]: 1,
                });
            });

            it('vpnbiz2023: totalMember=2 matches base without addons', async () => {
                renderModal('?plan=vpnbiz2023&totalMember=2');

                await waitFor(() => expect(mockOpenSubscriptionModal).toHaveBeenCalledTimes(1));
                const props = mockOpenSubscriptionModal.mock.calls[0][0];

                expect(props.plan).toBeUndefined();
                expect(props.planIDs).toEqual({
                    [PLANS.VPN_BUSINESS]: 1,
                });
            });

            it('vpnbiz2023: totalMember=3 adds 1 member addon', async () => {
                renderModal('?plan=vpnbiz2023&totalMember=3');

                await waitFor(() => expect(mockOpenSubscriptionModal).toHaveBeenCalledTimes(1));
                const props = mockOpenSubscriptionModal.mock.calls[0][0];

                expect(props.plan).toBeUndefined();
                expect(props.planIDs).toEqual({
                    [PLANS.VPN_BUSINESS]: 1,
                    [vpnBizMemberAddonName]: 1,
                });
            });
        });

        describe('edge cases for vpnbiz2023 IP counts', () => {
            const ipAddonName = getAddonNameByPlan(ADDON_PREFIXES.IP, PLANS.VPN_BUSINESS) as string;

            it('vpnbiz2023: totalIp=1 without addons', async () => {
                renderModal('?plan=vpnbiz2023&totalIp=1');

                await waitFor(() => expect(mockOpenSubscriptionModal).toHaveBeenCalledTimes(1));
                const props = mockOpenSubscriptionModal.mock.calls[0][0];

                expect(props.plan).toBeUndefined();
                expect(props.planIDs).toEqual({
                    [PLANS.VPN_BUSINESS]: 1,
                });
            });

            it('vpnbiz2023: totalIp=3 adds 2 IP addons (base includes 1)', async () => {
                renderModal('?plan=vpnbiz2023&totalIp=3');

                await waitFor(() => expect(mockOpenSubscriptionModal).toHaveBeenCalledTimes(1));
                const props = mockOpenSubscriptionModal.mock.calls[0][0];

                expect(props.plan).toBeUndefined();
                expect(props.planIDs).toEqual({
                    [PLANS.VPN_BUSINESS]: 1,
                    [ipAddonName]: 2,
                });
            });
        });
    });
});
