import {
    cleanBillingAddressVat,
    cleanVatNumber,
    getVatPrefix,
    isBareVatPrefix,
    vatNumberMissingPrefix,
} from './vatPrefixHelper';

describe('getVatPrefix', () => {
    it.each([
        ['DE', 'DE'],
        ['FR', 'FR'],
        ['IT', 'IT'],
        ['SE', 'SE'],
        ['NO', 'NO'],
    ])('returns the ISO code for standard VAT countries (%s)', (countryCode, expected) => {
        expect(getVatPrefix(countryCode)).toBe(expected);
    });

    it.each([
        ['US', 'EIN uses no prefix'],
        ['JP', 'not a country we collect VAT IDs for'],
        ['BR', 'not a country we collect VAT IDs for'],
    ])('returns null for non-VAT countries (%s — %s)', (countryCode) => {
        expect(getVatPrefix(countryCode)).toBeNull();
    });

    it('returns AU for AU (ABN is prefixed with AU for validation)', () => {
        expect(getVatPrefix('AU')).toBe('AU');
    });

    it('returns EL for GR (Greek VAT uses EL, not GR)', () => {
        expect(getVatPrefix('GR')).toBe('EL');
    });

    it('returns GB as default for GB (not XI)', () => {
        expect(getVatPrefix('GB')).toBe('GB');
    });

    it('returns CHE for CH (Swiss VAT uses CHE, not CH)', () => {
        expect(getVatPrefix('CH')).toBe('CHE');
    });

    it.each([
        ['IS', 'Iceland VSK numbers have no prefix'],
        ['LI', 'Liechtenstein numbers are not validated, so we do not prefill CHE'],
    ])('returns null for collected countries we do not prefix (%s — %s)', (countryCode) => {
        expect(getVatPrefix(countryCode)).toBeNull();
    });
});

describe('vatNumberMissingPrefix', () => {
    it.each([
        ['DE123456789', 'DE', false, 'correct DE prefix'],
        ['de123456789', 'DE', false, 'lowercase accepted'],
        ['123456789', 'DE', true, 'missing DE prefix'],
        ['FR123456789', 'DE', true, 'wrong country prefix'],
    ])('%s / %s → missing=%s (%s)', (vatNumber, countryCode, expected) => {
        expect(vatNumberMissingPrefix(vatNumber, countryCode)).toBe(expected);
    });

    it('returns false for US regardless of content (no prefix needed)', () => {
        expect(vatNumberMissingPrefix('12-3456789', 'US')).toBe(false);
        expect(vatNumberMissingPrefix('123456789', 'US')).toBe(false);
    });

    it('returns false for countries we do not collect VAT IDs for (no bogus prefix error)', () => {
        expect(vatNumberMissingPrefix('123456789', 'JP')).toBe(false);
        expect(vatNumberMissingPrefix('123456789', 'BR')).toBe(false);
    });

    it('returns true for AU without AU prefix', () => {
        expect(vatNumberMissingPrefix('51824753556', 'AU')).toBe(true);
        expect(vatNumberMissingPrefix('12345678912', 'AU')).toBe(true);
    });

    it('returns false for AU with AU prefix', () => {
        expect(vatNumberMissingPrefix('AU51824753556', 'AU')).toBe(false);
    });

    it('returns false for GR with EL prefix', () => {
        expect(vatNumberMissingPrefix('EL123456789', 'GR')).toBe(false);
    });

    it('returns true for GR with GR prefix (wrong prefix)', () => {
        expect(vatNumberMissingPrefix('GR123456789', 'GR')).toBe(true);
    });

    it('returns false for GB with GB prefix (standard)', () => {
        expect(vatNumberMissingPrefix('GB123456789', 'GB')).toBe(false);
    });

    it('returns false for GB with XI prefix (Northern Ireland)', () => {
        expect(vatNumberMissingPrefix('XI123456789', 'GB')).toBe(false);
    });

    it('returns true for GB with no prefix', () => {
        expect(vatNumberMissingPrefix('123456789', 'GB')).toBe(true);
    });

    it('returns false for CH with the CHE prefix', () => {
        expect(vatNumberMissingPrefix('CHE100416306MWST', 'CH')).toBe(false);
    });

    it('returns true for CH with the bare CH prefix (must be CHE)', () => {
        expect(vatNumberMissingPrefix('CH100416306', 'CH')).toBe(true);
    });

    it.each(['IS', 'LI'])('returns false for %s regardless of content (collected, but no prefix)', (countryCode) => {
        expect(vatNumberMissingPrefix('123456', countryCode)).toBe(false);
        expect(vatNumberMissingPrefix('CHE123456', countryCode)).toBe(false);
    });

    it('returns false when the value equals exactly the prefix (boundary case)', () => {
        expect(vatNumberMissingPrefix('DE', 'DE')).toBe(false);
        expect(vatNumberMissingPrefix('EL', 'GR')).toBe(false);
        expect(vatNumberMissingPrefix('AU', 'AU')).toBe(false);
        expect(vatNumberMissingPrefix('GB', 'GB')).toBe(false);
    });
});

describe('isBareVatPrefix', () => {
    it.each([
        ['DE', 'DE'],
        ['de', 'DE'],
        [' DE ', 'DE'],
        ['EL', 'GR'],
        ['CHE', 'CH'],
        ['GB', 'GB'],
        ['XI', 'GB'],
        ['AU', 'AU'],
    ])('returns true for a bare prefix %s / %s', (vatNumber, countryCode) => {
        expect(isBareVatPrefix(vatNumber, countryCode)).toBe(true);
    });

    it.each([
        ['DE123456789', 'DE', 'prefix plus digits'],
        ['CHE100416306MWST', 'CH', 'full Swiss number'],
        ['CH', 'CH', 'wrong prefix — CH is not CHE'],
        ['GR', 'GR', 'wrong prefix — GR is not EL'],
    ])('returns false for %s / %s (%s)', (vatNumber, countryCode) => {
        expect(isBareVatPrefix(vatNumber, countryCode)).toBe(false);
    });

    it.each(['', null, undefined])('returns false for empty input (%s)', (vatNumber) => {
        expect(isBareVatPrefix(vatNumber, 'DE')).toBe(false);
    });

    it.each([
        ['IS', 'collected but no prefix'],
        ['LI', 'collected but no prefix'],
        ['US', 'no prefix'],
        ['JP', 'not a VAT country'],
    ])('returns false for no-prefix countries even when value looks like a code (%s — %s)', (countryCode) => {
        expect(isBareVatPrefix(countryCode, countryCode)).toBe(false);
    });
});

describe('cleanVatNumber', () => {
    it.each([
        ['DE', 'DE'],
        ['CHE', 'CH'],
        ['EL', 'GR'],
        ['', 'DE'],
        [null, 'DE'],
        [undefined, 'DE'],
    ])('returns empty for a bare prefix or empty value (%s / %s)', (vatNumber, countryCode) => {
        expect(cleanVatNumber(vatNumber, countryCode)).toBe('');
    });

    it.each([
        ['DE123456789', 'DE'],
        ['IS', 'IS'],
    ])('returns the value when it is a real VAT number (%s / %s)', (vatNumber, countryCode) => {
        expect(cleanVatNumber(vatNumber, countryCode)).toBe(vatNumber);
    });
});

describe('cleanBillingAddressVat', () => {
    it('clears a bare prefix from both the top-level and nested VatId', () => {
        const result = cleanBillingAddressVat({
            VatId: 'DE',
            BillingAddress: { CountryCode: 'DE', VatId: 'DE' } as any,
        });

        expect(result.VatId).toBe('');
        expect((result.BillingAddress as any).VatId).toBe('');
    });

    it('keeps a complete VAT number in both places', () => {
        const result = cleanBillingAddressVat({
            VatId: 'DE123456789',
            BillingAddress: { CountryCode: 'DE', VatId: 'DE123456789' } as any,
        });

        expect(result.VatId).toBe('DE123456789');
        expect((result.BillingAddress as any).VatId).toBe('DE123456789');
    });

    it('does not mutate the input', () => {
        const input = { VatId: 'DE', BillingAddress: { CountryCode: 'DE', VatId: 'DE' } as any };
        cleanBillingAddressVat(input);

        expect(input.VatId).toBe('DE');
    });
});
