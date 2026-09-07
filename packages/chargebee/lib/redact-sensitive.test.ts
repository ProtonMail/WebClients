import { DROPPED, REDACTED, redactSensitive, toRedactedJson } from './redact-sensitive';

describe('redactSensitive', () => {
    it('should replace identifying values and keep the ones needed to diagnose a payment', () => {
        const directDebitSubmit = {
            type: 'direct-debit-submit',
            correlationId: 'id-9',
            customer: {
                email: 'customer@example.com',
                firstName: 'Given',
                lastName: 'Family',
                company: 'Example Ltd',
                customerNameType: 'individual',
                countryCode: 'NL',
                addressLine1: '1 Example Street',
            },
            bankAccount: { iban: 'NL00EXAMPLE0000000000' },
            paymentIntent: {
                id: 'pi_example',
                amount: 1999,
                currency_code: 'EUR',
                customer_id: 'cus_example',
                gateway_account_id: 'gw_example',
                status: 'inited',
                email: 'customer@example.com',
            },
        };

        expect(redactSensitive(directDebitSubmit)).toEqual({
            type: 'direct-debit-submit',
            correlationId: 'id-9',
            customer: {
                email: REDACTED,
                firstName: REDACTED,
                lastName: REDACTED,
                company: REDACTED,
                customerNameType: 'individual',
                countryCode: 'NL',
                addressLine1: REDACTED,
            },
            bankAccount: { iban: REDACTED },
            paymentIntent: {
                id: 'pi_example',
                amount: 1999,
                currency_code: 'EUR',
                customer_id: 'cus_example',
                gateway_account_id: 'gw_example',
                status: 'inited',
                email: REDACTED,
            },
        });
    });

    it('should match a key regardless of its casing or separators', () => {
        expect(redactSensitive({ address_line_1: 'a', AddressLine1: 'b', addressline1: 'c' })).toEqual({
            address_line_1: REDACTED,
            AddressLine1: REDACTED,
            addressline1: REDACTED,
        });
    });

    it('should redact inside arrays', () => {
        expect(redactSensitive({ people: [{ email: 'a@example.com', countryCode: 'CH' }] })).toEqual({
            people: [{ email: REDACTED, countryCode: 'CH' }],
        });
    });

    it('should stop at the depth limit rather than recurse without bound', () => {
        let nested: any = 'leaf';
        for (let i = 0; i < 12; i++) {
            nested = { nested };
        }

        expect(JSON.stringify(redactSensitive(nested))).toContain('[depth limit]');
    });

    it('should serialise a circular payload, because the depth limit breaks the cycle', () => {
        const circular: any = { zip: '1000' };
        circular.self = circular;

        const json = toRedactedJson(circular);
        expect(JSON.parse(json).zip).toBe(REDACTED);
        expect(json).toContain('[depth limit]');
    });

    it('should describe a payload it cannot serialise instead of throwing', () => {
        // A bigint has no JSON representation, so `JSON.stringify` throws on it.
        expect(toRedactedJson({ amount: BigInt(1) })).toContain('[unserializable:');
    });

    it('should describe hostile input instead of throwing on the reporting path', () => {
        const throwingOwnKeys = new Proxy(
            {},
            {
                ownKeys: () => {
                    throw new Error('ownKeys boom');
                },
            }
        );
        const throwingGetter = {
            get cssVariables(): unknown {
                throw new Error('getter boom');
            },
        };

        expect(toRedactedJson(throwingOwnKeys)).toBe('[unserializable: ownKeys boom]');
        expect(toRedactedJson(throwingGetter)).toBe('[unserializable: getter boom]');
    });

    it('should drop the theme and copy blobs of a set-configuration payload and keep the rest', () => {
        const setConfiguration = {
            type: 'set-configuration',
            correlationId: 'id-1',
            paymentMethodType: 'card',
            renderMode: 'one-line',
            themeType: 'dark',
            site: 'proton-test',
            publishableKey: 'test_pk_example',
            domain: 'proton.me',
            cssVariables: {
                '--signal-danger': '#ff0000',
                '--field-background-color': '#ffffff',
            },
            translations: {
                cardNumberPlaceholder: 'Card number',
                invalidCardNumberMessage: 'Invalid card number',
            },
        };

        expect(redactSensitive(setConfiguration)).toEqual({
            type: 'set-configuration',
            correlationId: 'id-1',
            paymentMethodType: 'card',
            renderMode: 'one-line',
            themeType: 'dark',
            site: 'proton-test',
            publishableKey: 'test_pk_example',
            domain: 'proton.me',
            cssVariables: DROPPED,
            translations: DROPPED,
        });
    });

    it('should drop the theme blob of an update-fields payload', () => {
        const updateFields = {
            type: 'update-fields',
            correlationId: 'id-2',
            cssVariables: { '--signal-danger': '#ff0000' },
        };

        expect(redactSensitive(updateFields)).toEqual({
            type: 'update-fields',
            correlationId: 'id-2',
            cssVariables: DROPPED,
        });
    });

    it('should mark noise differently from privacy, so a dropped value never reads as withheld', () => {
        expect(DROPPED).not.toBe(REDACTED);
        expect(redactSensitive({ cssVariables: { a: 'b' }, email: 'customer@example.com' })).toEqual({
            cssVariables: '[dropped]',
            email: '[redacted]',
        });
    });

    it('should drop a noisy key regardless of its casing or separators', () => {
        expect(redactSensitive({ cssVariables: {}, css_variables: {}, CSSVariables: {}, Translations: {} })).toEqual({
            cssVariables: DROPPED,
            css_variables: DROPPED,
            CSSVariables: DROPPED,
            Translations: DROPPED,
        });
    });

    it('should drop a noisy key nested below the top level', () => {
        expect(redactSensitive({ data: { config: { cssVariables: { a: 'b' }, site: 'proton-test' } } })).toEqual({
            data: { config: { cssVariables: DROPPED, site: 'proton-test' } },
        });
    });
});
