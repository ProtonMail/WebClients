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

export function normalizePostalCode(postalCode: string, countryCode: string) {
    switch (countryCode) {
        case 'US':
            return normalizeUSPostalCode(postalCode);
        case 'CA':
            return normalizeCanadianPostalCode(postalCode);
        default:
            return postalCode;
    }
}
