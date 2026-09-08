import { telemetry } from '@proton/shared/lib/telemetry';

import type { BillingAddressExtended } from '../core/billing-address/billing-address';
import { CYCLE, PLANS } from '../core/constants';
import { getInitialBillingAddressProperties } from './helpers';
import { reportInitialization } from './shared-checkout-telemetry';

jest.mock('@proton/shared/lib/telemetry', () => ({
    telemetry: { sendCustomEvent: jest.fn() },
}));

const sendCustomEvent = telemetry.sendCustomEvent as jest.Mock;

/**
 * The complete set of billing address facts we are allowed to report. A new entry here must be a
 * deliberate decision, not a side effect of a wider address object being passed in.
 */
const REPORTED_PROPERTIES = ['initialCountry', 'initialHasZipCode', 'initialState'];

/** Everything a billing address can carry in the signup flows, including the parts we must not send. */
const addressWithPersonalData: BillingAddressExtended = {
    CountryCode: 'DE',
    State: null,
    ZipCode: '10115',
    Company: 'Example GmbH',
    Address: '1 Example Street',
    City: 'Example City',
    FirstName: 'Example',
    LastName: 'Customer',
};

describe('getInitialBillingAddressProperties', () => {
    it('returns only the reported properties, however much it is given', () => {
        const properties = getInitialBillingAddressProperties(addressWithPersonalData);

        expect(Object.keys(properties).sort()).toEqual(REPORTED_PROPERTIES);
        expect(properties).toEqual({
            initialCountry: 'DE',
            initialState: null,
            initialHasZipCode: true,
        });
    });

    it('reports whether a zip code exists rather than its value', () => {
        const properties = getInitialBillingAddressProperties({
            CountryCode: 'US',
            State: 'CA',
            ZipCode: '94103',
        });

        expect(properties).toEqual({
            initialCountry: 'US',
            initialState: 'CA',
            initialHasZipCode: true,
        });
        expect(JSON.stringify(properties)).not.toContain('94103');
    });

    it.each([
        ['an empty zip code', '' as string | null | undefined],
        ['a null zip code', null],
        ['a missing zip code', undefined],
    ])('reports %s as false', (_, ZipCode) => {
        expect(getInitialBillingAddressProperties({ CountryCode: 'US', State: 'CA', ZipCode })).toEqual({
            initialCountry: 'US',
            initialState: 'CA',
            initialHasZipCode: false,
        });
    });

    it('reports an empty country or state as null rather than an empty string', () => {
        expect(getInitialBillingAddressProperties({ CountryCode: '', State: '', ZipCode: '' })).toEqual({
            initialCountry: null,
            initialState: null,
            initialHasZipCode: false,
        });
    });
});

describe('reportInitialization', () => {
    beforeEach(() => {
        sendCustomEvent.mockClear();
    });

    const reportWithAddress = (initialBillingAddress: BillingAddressExtended) => {
        reportInitialization({
            context: 'account-home',
            userCurrency: 'EUR',
            subscription: undefined,
            selectedCurrency: 'EUR',
            selectedPlanIDs: { [PLANS.MAIL]: 1 },
            selectedCycle: CYCLE.MONTHLY,
            selectedCoupon: null,
            selectedStep: null,
            build: 'proton-account',
            product: 'proton-mail',
            isTrial: false,
            initialBillingAddress,
        });

        expect(sendCustomEvent).toHaveBeenCalledTimes(1);
        const [eventName, payload] = sendCustomEvent.mock.calls[0];
        expect(eventName).toBe('account_home_init');
        return payload as Record<string, unknown>;
    };

    it('sends the reduced billing address facts', () => {
        expect(reportWithAddress(addressWithPersonalData)).toMatchObject({
            initialCountry: 'DE',
            initialState: null,
            initialHasZipCode: true,
        });
    });

    it('never sends the address itself, not even the raw property it was given', () => {
        const payload = reportWithAddress(addressWithPersonalData);

        expect(Object.keys(payload)).not.toContain('initialBillingAddress');
        for (const property of Object.keys(addressWithPersonalData)) {
            expect(Object.keys(payload)).not.toContain(property);
        }
        for (const value of ['10115', 'Example GmbH', '1 Example Street', 'Example City', 'Customer']) {
            expect(JSON.stringify(payload)).not.toContain(value);
        }
    });

    it('reports an address that carries nothing usable as nulls', () => {
        expect(reportWithAddress({ CountryCode: '' })).toMatchObject({
            initialCountry: null,
            initialState: null,
            initialHasZipCode: false,
        });
    });

    /**
     * Every property the initialization event sends. Adding one must be a deliberate decision -
     * if this list needs updating, check the new property against "Privacy: What We May Send"
     * in README.internal.md first.
     */
    it('sends only the properties we expect, whatever the address carries', () => {
        expect(Object.keys(reportWithAddress(addressWithPersonalData)).sort()).toEqual([
            'build',
            'currentCoupon',
            'currentCurrency',
            'currentCycle',
            'currentPlanIDs',
            'currentPlanName',
            'initialCountry',
            'initialHasZipCode',
            'initialState',
            'isTrial',
            'product',
            'selectedCoupon',
            'selectedCurrency',
            'selectedCycle',
            'selectedPlanIDs',
            'selectedPlanName',
            'selectedStep',
        ]);
    });
});
