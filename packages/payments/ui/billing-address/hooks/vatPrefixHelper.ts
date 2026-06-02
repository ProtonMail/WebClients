import { countriesWithVatNumberOnSignup } from './countriesWithVatId';

// Countries where the VAT prefix differs from the ISO-3166 code.
// First entry is the default used for prefill.
const VAT_VALID_PREFIXES: Record<string, string[]> = {
    GR: ['EL'], // Greece uses EL, not GR
    GB: ['GB', 'XI'], // XI = Northern Ireland
};

/**
 * Returns every valid VAT prefix for a country, or null if the country
 * doesn't use a VAT prefix (US and any country we don't collect VAT IDs for,
 * e.g. JP, BR). The VAT field is rendered for all countries in
 * EditBillingAddress, so gating here is what stops non-VAT countries from
 * being prefilled with — and validated against — a bogus country-code prefix.
 */
export function getValidVatPrefixes(countryCode: string): string[] | null {
    if (!countriesWithVatNumberOnSignup.has(countryCode)) {
        return null;
    }
    return VAT_VALID_PREFIXES[countryCode] ?? [countryCode];
}

/**
 * Returns the default prefill prefix for a country, or null if the country
 * doesn't use a VAT prefix (see getValidVatPrefixes).
 */
export function getVatPrefix(countryCode: string): string | null {
    return getValidVatPrefixes(countryCode)?.[0] ?? null;
}

/**
 * Returns true if the VAT number is missing every valid prefix for the country.
 * Always false for countries that don't use a VAT prefix (see getValidVatPrefixes).
 */
export function vatNumberMissingPrefix(vatNumber: string, countryCode: string): boolean {
    const validPrefixes = getValidVatPrefixes(countryCode);
    if (validPrefixes === null) {
        return false;
    }
    return !validPrefixes.some((p) => vatNumber.toUpperCase().startsWith(p.toUpperCase()));
}
