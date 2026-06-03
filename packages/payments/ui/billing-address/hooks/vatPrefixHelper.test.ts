import { getVatPrefix, vatNumberMissingPrefix } from './vatPrefixHelper';

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

    it('returns CHE for LI (Liechtenstein shares the Swiss VAT system)', () => {
        expect(getVatPrefix('LI')).toBe('CHE');
    });

    it('returns null for IS (collected, but Iceland VSK numbers may have no prefix)', () => {
        expect(getVatPrefix('IS')).toBeNull();
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

    it('returns false for CH/LI with the CHE prefix', () => {
        expect(vatNumberMissingPrefix('CHE100416306MWST', 'CH')).toBe(false);
        expect(vatNumberMissingPrefix('CHE100416306MWST', 'LI')).toBe(false);
    });

    it('returns true for CH/LI with the bare CH prefix (must be CHE)', () => {
        expect(vatNumberMissingPrefix('CH100416306', 'CH')).toBe(true);
        expect(vatNumberMissingPrefix('LI100416306', 'LI')).toBe(true);
    });

    it('returns false for IS regardless of content (collected, but no prefix)', () => {
        expect(vatNumberMissingPrefix('123456', 'IS')).toBe(false);
        expect(vatNumberMissingPrefix('IS123456', 'IS')).toBe(false);
    });

    it('returns false when the value equals exactly the prefix (boundary case)', () => {
        expect(vatNumberMissingPrefix('DE', 'DE')).toBe(false);
        expect(vatNumberMissingPrefix('EL', 'GR')).toBe(false);
        expect(vatNumberMissingPrefix('AU', 'AU')).toBe(false);
        expect(vatNumberMissingPrefix('GB', 'GB')).toBe(false);
    });
});
