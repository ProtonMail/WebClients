import { isCountryWithRequiredPostalCode } from '../core/countries';

function normalizeUSPostalCode(postalCode: string): string {
    return postalCode.replace(/\s/g, '');
}

function normalizeCanadianPostalCode(postalCode: string): string {
    // Remove all non-alphanumeric characters and convert to uppercase
    const cleaned = postalCode.replace(/[^A-Za-z0-9]/g, '').toUpperCase();

    // Ensure proper format: XXX XXX (3 chars, space, 3 chars)
    if (cleaned.length === 6) {
        return cleaned.slice(0, 3) + ' ' + cleaned.slice(3);
    }

    // If not exactly 6 characters, return as-is but trimmed
    return postalCode.trim();
}

export function normalizePostalCode(postalCode: string, countryCode: string | null) {
    if (!countryCode) {
        return null;
    }
    const normalizedCountryCode = countryCode.toUpperCase();
    // Never send the postal code if it's not required. It's also hidden in the UI. The reason that it's important to drop
    // it is because it may have gotten set to a default value. And that's problematic because the user wouldn't be able to
    // change it.
    if (!isCountryWithRequiredPostalCode(normalizedCountryCode)) {
        return null;
    }
    switch (normalizedCountryCode) {
        case 'US':
            return normalizeUSPostalCode(postalCode);
        case 'CA':
            return normalizeCanadianPostalCode(postalCode);
    }
}
