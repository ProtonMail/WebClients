import { telemetry } from '@proton/shared/lib/telemetry';

import { buildSubscription } from '../testing/buildSubscription';
import { setOfferedApplePayFlow } from '../core/apple-pay-support';
import type { FullBillingAddress } from '../core/billing-address/billing-address';
import { ADDON_NAMES, CYCLE, PAYMENT_METHOD_TYPES, PLANS } from '../core/constants';
import { checkoutTelemetry } from './telemetry';

jest.mock('@proton/shared/lib/telemetry', () => ({
    telemetry: { sendCustomEvent: jest.fn() },
}));

const sendCustomEvent = telemetry.sendCustomEvent as jest.Mock;

/**
 * Every event payload we hand to Proton Analytics, snapshotted.
 *
 * The payloads are the contract with the data team, the same way the event names are: a property that
 * appears, disappears or changes type breaks their dashboards, and a property that appears by accident
 * - a whole User, Subscription or billing address spread into an event - sends customer data to
 * analytics. Both show up here as a reviewable diff.
 *
 * If a snapshot fails, decide which happened. An intended change is updated here and notified to the
 * data team, together with the documentation. An unintended one is a bug in the caller.
 *
 * The inputs are deliberately noisy: a paid subscription, a coupon, and addresses carrying the name,
 * street, city, company, zip and VAT number that must never reach an event.
 */
const subscription = buildSubscription({ planIDs: { [PLANS.MAIL]: 1 }, currency: 'EUR', cycle: CYCLE.YEARLY }, {
    CouponCode: 'CURRENT_COUPON',
});

const billingAddressWithPersonalData = {
    CountryCode: 'DE',
    State: null,
    ZipCode: '10115',
    Company: 'Example GmbH',
    Address: '1 Example Street',
    City: 'Example City',
    FirstName: 'Example',
    LastName: 'Customer',
};

const fullAddress = (
    overrides: Partial<typeof billingAddressWithPersonalData>,
    VatId: string
): FullBillingAddress => ({
    BillingAddress: { ...billingAddressWithPersonalData, ...overrides },
    VatId,
});

/** Shared by the events that describe an in-progress checkout */
const checkoutState = {
    context: 'subscription-modification',
    userCurrency: 'CHF',
    subscription,
    selectedCurrency: 'EUR',
    selectedPlanIDs: { [PLANS.BUNDLE_PRO_2024]: 1, [ADDON_NAMES.MEMBER_BUNDLE_PRO_2024]: 5 },
    selectedCycle: CYCLE.TWO_YEARS,
    selectedCoupon: 'SELECTED_COUPON',
    build: 'proton-account',
    product: 'proton-mail',
    isTrial: false,
} as const;

const savedCard = {
    paymentMethodType: PAYMENT_METHOD_TYPES.CHARGEBEE_CARD,
    paymentMethodValue: 'kHMKYDaZLKHWIfCsuwpbNZ0bYZDpQDwRaOKPCGdCmqNCLXiWm5Vf8g==',
} as const;

const sentEvent = () => {
    expect(sendCustomEvent).toHaveBeenCalledTimes(1);
    const [event, payload] = sendCustomEvent.mock.calls[0];

    return { event, payload };
};

beforeEach(() => sendCustomEvent.mockClear());
afterEach(() => setOfferedApplePayFlow(null));

describe('event payloads sent to Proton Analytics', () => {
    it('init', () => {
        checkoutTelemetry.reportInitialization({
            ...checkoutState,
            selectedStep: 'checkout',
            initialBillingAddress: billingAddressWithPersonalData,
        });

        expect(sentEvent()).toMatchSnapshot();
    });

    it('estimation_change', () => {
        checkoutTelemetry.reportSubscriptionEstimationChange({
            ...checkoutState,
            action: 'cycle_changed',
            ...savedCard,
        });

        expect(sentEvent()).toMatchSnapshot();
    });

    it('payment', () => {
        checkoutTelemetry.reportPayment({ ...checkoutState, stage: 'payment_success', amount: 23976, ...savedCard });

        expect(sentEvent()).toMatchSnapshot();
    });

    it('payment, with the Apple Pay flow that was offered', () => {
        setOfferedApplePayFlow('qr');

        checkoutTelemetry.reportPayment({
            ...checkoutState,
            stage: 'attempt',
            amount: 23976,
            paymentMethodType: PAYMENT_METHOD_TYPES.APPLE_PAY,
            paymentMethodValue: PAYMENT_METHOD_TYPES.APPLE_PAY,
        });

        expect(sentEvent()).toMatchSnapshot();
    });

    it('payment, with the extra properties of a rejected billing address', () => {
        checkoutTelemetry.reportPayment({
            ...checkoutState,
            stage: 'billing_address_failure',
            amount: 23976,
            ...savedCard,
            CountryCode: 'US',
            State: 'CA',
            hasZipCode: false,
        });

        expect(sentEvent()).toMatchSnapshot();
    });

    it('change_billing_country', () => {
        checkoutTelemetry.reportBillingCountryChange({
            context: 'subscription-modification',
            action: 'change_state',
            currentCountry: 'US',
            selectedCountry: 'US',
            currentState: 'CA',
            selectedState: 'NY',
        });

        expect(sentEvent()).toMatchSnapshot();
    });

    it('open_modal', () => {
        checkoutTelemetry.reportUpsellModalOpen({
            context: 'account-home',
            userCurrency: 'CHF',
            subscription,
            selectedPlanIDs: { [PLANS.BUNDLE]: 1 },
            build: 'proton-account',
            product: 'proton-mail',
        });

        expect(sentEvent()).toMatchSnapshot();
    });

    it('billing_address_edit', () => {
        checkoutTelemetry.reportBillingAddressEditSuccess({
            source: 'invoices',
            previousBillingAddress: fullAddress({}, 'DE000000001'),
            nextBillingAddress: fullAddress({ CountryCode: 'FR', City: 'Another City', ZipCode: '75001' }, 'FR000000002'),
        });

        expect(sentEvent()).toMatchSnapshot();
    });

    it('add_lumo', () => {
        checkoutTelemetry.reportAddLumo({ context: 'subscription-modification' });

        expect(sentEvent()).toMatchSnapshot();
    });

    it('add_meet', () => {
        checkoutTelemetry.reportAddMeet({ context: 'subscription-modification' });

        expect(sentEvent()).toMatchSnapshot();
    });

    it('add_pass', () => {
        checkoutTelemetry.reportAddPass({ context: 'subscription-modification' });

        expect(sentEvent()).toMatchSnapshot();
    });

    it('change_step', () => {
        checkoutTelemetry.subscriptionContainer.reportChangeStep({
            step: 'checkout',
            build: 'proton-account',
            product: 'proton-mail',
        });

        expect(sentEvent()).toMatchSnapshot();
    });

    it('change_audience', () => {
        checkoutTelemetry.subscriptionContainer.reportAudienceChange({
            audience: 'family',
            build: 'proton-account',
            product: 'proton-mail',
        });

        expect(sentEvent()).toMatchSnapshot();
    });

    it('plan_description', () => {
        checkoutTelemetry.subscriptionContainer.reportPlanDescriptionInteraction({ action: 'expand' });

        expect(sentEvent()).toMatchSnapshot();
    });

    it('closed_by_user', () => {
        checkoutTelemetry.subscriptionContainer.reportClosedByUser({ build: 'proton-account', product: 'proton-mail' });

        expect(sentEvent()).toMatchSnapshot();
    });

    it('vpn2024_addons_experiment_seen', () => {
        checkoutTelemetry.subscriptionContainer.reportVpn2024AddonsExperimentSeen({ variant: 'pass-addon-only' });

        expect(sentEvent()).toMatchSnapshot();
    });

    /**
     * The snapshots above show what we send, but a snapshot can be updated without reading it. This
     * says the quiet part out loud, so that a payload which starts carrying customer data fails with a
     * message about customer data rather than as a diff someone accepts.
     */
    it.each([
        [
            'init',
            () =>
                checkoutTelemetry.reportInitialization({
                    ...checkoutState,
                    selectedStep: 'checkout',
                    initialBillingAddress: billingAddressWithPersonalData,
                }),
        ],
        ['payment', () => checkoutTelemetry.reportPayment({ ...checkoutState, stage: 'attempt', amount: 1, ...savedCard })],
        [
            'estimation_change',
            () =>
                checkoutTelemetry.reportSubscriptionEstimationChange({
                    ...checkoutState,
                    action: 'plan_changed',
                    ...savedCard,
                }),
        ],
        [
            'billing_address_edit',
            () =>
                checkoutTelemetry.reportBillingAddressEditSuccess({
                    source: 'pay-button',
                    previousBillingAddress: fullAddress({}, 'DE000000001'),
                    nextBillingAddress: fullAddress({ City: 'Another City' }, 'FR000000002'),
                }),
        ],
    ])('sends no customer data in %s', (_, report) => {
        report();

        const serialized = JSON.stringify(sentEvent().payload);

        for (const personalData of [
            'Example GmbH',
            '1 Example Street',
            'Example City',
            'Another City',
            'Example',
            'Customer',
            '10115',
            '75001',
            'DE000000001',
            'FR000000002',
            savedCard.paymentMethodValue,
        ]) {
            expect(serialized).not.toContain(personalData);
        }
    });
});
