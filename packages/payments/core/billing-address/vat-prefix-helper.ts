import type { FullBillingAddress } from './billing-address';
import { countriesWithVatNumberOnSignup } from './countries-with-vat-id';

const VAT_VALID_PREFIXES: Record<string, string[]> = {
    GR: ['EL'],
    GB: ['GB', 'XI'],
    CH: ['CHE'],
};

const COLLECTED_COUNTRIES_WITHOUT_VAT_PREFIX = new Set(['IS', 'LI']);

export function getValidVatPrefixes(countryCode: string): string[] | null {
    if (!countriesWithVatNumberOnSignup.has(countryCode) || COLLECTED_COUNTRIES_WITHOUT_VAT_PREFIX.has(countryCode)) {
        return null;
    }
    return VAT_VALID_PREFIXES[countryCode] ?? [countryCode];
}

export function getVatPrefix(countryCode: string): string | null {
    return getValidVatPrefixes(countryCode)?.[0] ?? null;
}

export function vatNumberMissingPrefix(vatNumber: string, countryCode: string): boolean {
    const validPrefixes = getValidVatPrefixes(countryCode);
    if (validPrefixes === null) {
        return false;
    }
    return !validPrefixes.some((p) => vatNumber.toUpperCase().startsWith(p.toUpperCase()));
}

export function isBareVatPrefix(vatNumber: string | null | undefined, countryCode: string): boolean {
    const validPrefixes = getValidVatPrefixes(countryCode);
    if (validPrefixes === null || !vatNumber) {
        return false;
    }
    const normalized = vatNumber.trim().toUpperCase();
    return validPrefixes.some((p) => p.toUpperCase() === normalized);
}

export function cleanVatNumber(vatNumber: string | null | undefined, countryCode: string): string {
    return !vatNumber || isBareVatPrefix(vatNumber, countryCode) ? '' : vatNumber;
}

export function cleanBillingAddressVat(fullBillingAddress: FullBillingAddress): FullBillingAddress {
    const VatId = cleanVatNumber(fullBillingAddress.VatId, fullBillingAddress.BillingAddress.CountryCode);
    return {
        ...fullBillingAddress,
        VatId,
        BillingAddress: { ...fullBillingAddress.BillingAddress, VatId } as FullBillingAddress['BillingAddress'],
    };
}
