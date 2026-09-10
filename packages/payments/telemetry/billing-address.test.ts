import { telemetry } from '@proton/shared/lib/telemetry';

import type { FullBillingAddress } from '../core/billing-address/billing-address';
import { getBillingAddressEditProperties, reportBillingAddressEditSuccess } from './billing-address';

jest.mock('@proton/shared/lib/telemetry', () => ({
    telemetry: { sendCustomEvent: jest.fn() },
}));

const sendCustomEvent = telemetry.sendCustomEvent as jest.Mock;

/**
 * The complete set of properties this event may report. Adding one must be a deliberate decision -
 * check it against "Privacy: What We May Send" in README.internal.md first.
 */
const REPORTED_PROPERTIES = [
    'addressChanged',
    'cityChanged',
    'companyChanged',
    'firstNameChanged',
    'lastNameChanged',
    'nextCountry',
    'nextState',
    'previousCountry',
    'previousState',
    'vatIdChanged',
    'zipCodeChanged',
];

const previous: FullBillingAddress = {
    BillingAddress: {
        CountryCode: 'DE',
        State: null,
        ZipCode: '10115',
        Company: 'Example GmbH',
        Address: '1 Example Street',
        City: 'Example City',
        FirstName: 'Example',
        LastName: 'Customer',
    },
    VatId: 'DE111111111',
};

const withChanges = (changes: Partial<FullBillingAddress['BillingAddress']>): FullBillingAddress => ({
    ...previous,
    BillingAddress: { ...previous.BillingAddress, ...changes },
});

describe('getBillingAddressEditProperties', () => {
    it('reports only the expected properties, and no field values beyond country and state', () => {
        const properties = getBillingAddressEditProperties(previous, withChanges({ ZipCode: '10117' }));

        expect(Object.keys(properties).sort()).toEqual(REPORTED_PROPERTIES);
        for (const value of ['10115', '10117', 'Example GmbH', '1 Example Street', 'Example City', 'Customer']) {
            expect(JSON.stringify(properties)).not.toContain(value);
        }
    });

    it('reports the country and state on both sides of the change', () => {
        expect(
            getBillingAddressEditProperties(previous, withChanges({ CountryCode: 'US', State: 'CA' }))
        ).toMatchObject({
            previousCountry: 'DE',
            previousState: null,
            nextCountry: 'US',
            nextState: 'CA',
        });
    });

    it('reports nothing as changed when the address is saved untouched', () => {
        expect(getBillingAddressEditProperties(previous, previous)).toEqual({
            previousCountry: 'DE',
            nextCountry: 'DE',
            previousState: null,
            nextState: null,
            zipCodeChanged: false,
            vatIdChanged: false,
            companyChanged: false,
            cityChanged: false,
            addressChanged: false,
            firstNameChanged: false,
            lastNameChanged: false,
        });
    });

    it.each([
        ['zipCodeChanged', { ZipCode: '10117' }],
        ['companyChanged', { Company: 'Other GmbH' }],
        ['cityChanged', { City: 'Other City' }],
        ['addressChanged', { Address: '2 Other Street' }],
        ['firstNameChanged', { FirstName: 'Other' }],
        ['lastNameChanged', { LastName: 'Person' }],
    ])('flags %s on its own without flagging the others', (flag, changes) => {
        const properties = getBillingAddressEditProperties(previous, withChanges(changes));
        const flagged = Object.entries(properties)
            .filter(([key, value]) => key.endsWith('Changed') && value === true)
            .map(([key]) => key);

        expect(flagged).toEqual([flag]);
    });

    it('flags a VAT number change', () => {
        const properties = getBillingAddressEditProperties(previous, { ...previous, VatId: 'DE222222222' });

        expect(properties.vatIdChanged).toBe(true);
        expect(JSON.stringify(properties)).not.toContain('DE222222222');
    });

    it('treats an empty string and an absent value as the same', () => {
        const emptied = withChanges({ Company: '' });
        const absent = withChanges({ Company: null });

        expect(getBillingAddressEditProperties(emptied, absent).companyChanged).toBe(false);
    });
});

describe('reportBillingAddressEditSuccess', () => {
    beforeEach(() => {
        sendCustomEvent.mockClear();
    });

    it('sends the save stage, the source and the reduced properties', () => {
        reportBillingAddressEditSuccess({
            source: 'invoices',
            previousBillingAddress: previous,
            nextBillingAddress: withChanges({ City: 'Other City' }),
        });

        expect(sendCustomEvent).toHaveBeenCalledTimes(1);
        const [eventName, payload] = sendCustomEvent.mock.calls[0];

        expect(eventName).toBe('billing_address_edit');
        expect(Object.keys(payload).sort()).toEqual(['source', 'stage', ...REPORTED_PROPERTIES].sort());
        expect(payload).toMatchObject({
            stage: 'save_success',
            source: 'invoices',
            cityChanged: true,
            zipCodeChanged: false,
        });
    });

    it('never sends any of the address values it was given', () => {
        reportBillingAddressEditSuccess({
            source: 'pay-button',
            previousBillingAddress: previous,
            nextBillingAddress: withChanges({ Address: '2 Other Street' }),
        });

        const [, payload] = sendCustomEvent.mock.calls[0];
        for (const value of ['10115', 'Example GmbH', '1 Example Street', 'Example City', 'Customer', 'DE111111111']) {
            expect(JSON.stringify(payload)).not.toContain(value);
        }
    });
});
