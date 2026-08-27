import type { FullBillingAddress } from '@proton/payments/core/billing-address/billing-address';

import { countriesWithVatNumberOnSignup } from './countriesWithVatId';

// Countries where the VAT prefix differs from the ISO-3166 code.
// First entry is the default used for prefill.
const VAT_VALID_PREFIXES: Record<string, string[]> = {
    GR: ['EL'], // Greece uses EL, not GR
    GB: ['GB', 'XI'], // XI = Northern Ireland
    CH: ['CHE'], // Switzerland uses CHE, not CH
};

// VAT-collected countries we deliberately don't prefill or enforce a prefix for:
// - IS: Iceland's VSK number has no prefix.
// - LI: shares Switzerland's CHE prefix, but its numbers aren't in the validation
//   library, so prefilling CHE would let a bare "CHE" pass as a valid VAT number.
const COLLECTED_COUNTRIES_WITHOUT_VAT_PREFIX = new Set(['IS', 'LI']);

/**
 * Returns every valid VAT prefix for a country, or null when the country uses no
 * prefix — whether because we don't collect its VAT ID, or because we do but its
 * number has none. The VAT field renders for every country in EditBillingAddress,
 * so this gate is what stops a bogus country-code prefix being prefilled/validated.
 */
export function getValidVatPrefixes(countryCode: string): string[] | null {
    if (!countriesWithVatNumberOnSignup.has(countryCode) || COLLECTED_COUNTRIES_WITHOUT_VAT_PREFIX.has(countryCode)) {
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

/**
 * Returns true when the VAT number is nothing more than a country's prefilled prefix
 * (e.g. "DE", "CHE", "EL"). A bare prefix is treated as an empty VAT number, both for
 * validation and for the backend payload. Always false for countries without a prefix.
 */
export function isBareVatPrefix(vatNumber: string | null | undefined, countryCode: string): boolean {
    const validPrefixes = getValidVatPrefixes(countryCode);
    if (validPrefixes === null || !vatNumber) {
        return false;
    }
    const normalized = vatNumber.trim().toUpperCase();
    return validPrefixes.some((p) => p.toUpperCase() === normalized);
}

/**
 * The VAT number to send to the backend: empty when the field holds only a bare prefix
 * (the prefilled placeholder), so the API never receives an incomplete VAT number.
 */
export function cleanVatNumber(vatNumber: string | null | undefined, countryCode: string): string {
    return !vatNumber || isBareVatPrefix(vatNumber, countryCode) ? '' : vatNumber;
}

/**
 * Cleans the VAT number on a FullBillingAddress. Use before sending to the backend.
 */
export function cleanBillingAddressVat(fullBillingAddress: FullBillingAddress): FullBillingAddress {
    const VatId = cleanVatNumber(fullBillingAddress.VatId, fullBillingAddress.BillingAddress.CountryCode);
    return {
        ...fullBillingAddress,
        VatId,
        BillingAddress: { ...fullBillingAddress.BillingAddress, VatId } as FullBillingAddress['BillingAddress'],
    };
}
