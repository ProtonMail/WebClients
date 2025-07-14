import usZipCodesPatterns from './us-zip-codes-patterns.json';

function createZipRegex(zipPattern: string) {
    // Create and return the RegExp object that handles both standard ZIP (5 digits)
    // and extended ZIP format with optional hyphen followed by any characters.
    // Before sending ZIP code to the backend, we will drop the part after the hyphen.
    return new RegExp(`^(${zipPattern})\\d*(-\\d{4})?$`);
}

function getZipRegexByStateCode(stateCode: string): RegExp | null {
    const stateData = usZipCodesPatterns[stateCode as keyof typeof usZipCodesPatterns];
    if (!stateData) {
        return null;
    }

    return createZipRegex(stateData.data.zip);
}

function getMainZipCode(zipCode: string): string {
    return zipCode.split('-')[0];
}

function cleanUSZipCode(zipCode: string): string {
    return zipCode.trim();
}

function validateUSPostalCode(stateCode: string, zipCode: string): boolean {
    const cleanedZipCode = cleanUSZipCode(zipCode);

    const regex = getZipRegexByStateCode(stateCode);
    if (!regex) {
        return false;
    }

    const ZIP_CODE_LENGTH = 5;

    return regex.test(cleanedZipCode) && getMainZipCode(cleanedZipCode).length === ZIP_CODE_LENGTH;
}

function cleanCanadianPostalCode(postalCode: string): string {
    // Remove common separators (spaces, hyphens, dots) and convert to uppercase
    return postalCode
        .replace(/[\s\-\.]/g, '')
        .trim()
        .toUpperCase();
}

function validateCanadianPostalCode(stateCode: string, postalCode: string): boolean {
    const cleanedPostalCode = cleanCanadianPostalCode(postalCode);

    // Check if it's exactly 6 characters with alternating letter-digit pattern
    // Canadian postal code format: A1A1A1 (Letter-Digit-Letter-Digit-Letter-Digit)
    const canadianPostalCodeRegex = /^[A-Z]\d[A-Z]\d[A-Z]\d$/;

    return canadianPostalCodeRegex.test(cleanedPostalCode);
}

export function isPostalCodeValid(countryCode: string, stateCode: string, postalCode: string): boolean {
    switch (countryCode) {
        case 'US':
            return validateUSPostalCode(stateCode, postalCode);
        case 'CA':
            return validateCanadianPostalCode(stateCode, postalCode);
        default:
            return true;
    }
}

function getStateCodeByUSPostalCode(postalCode: string): string | undefined {
    return Object.keys(usZipCodesPatterns).find((stateCode) => {
        const regex = getZipRegexByStateCode(stateCode);
        return regex?.test(postalCode);
    });
}

function getStateCodeByCanadianPostalCode(postalCode: string): string | undefined {
    const cleanedCode = cleanCanadianPostalCode(postalCode);

    // Get the first letter which determines the province/territory
    const firstLetter = cleanedCode.charAt(0);

    // Map first letter to province/territory code
    const provinceMap: Record<string, string> = {
        A: 'NL', // Newfoundland and Labrador
        B: 'NS', // Nova Scotia
        C: 'PE', // Prince Edward Island
        E: 'NB', // New Brunswick
        G: 'QC', // Quebec
        H: 'QC', // Quebec
        J: 'QC', // Quebec
        K: 'ON', // Ontario
        L: 'ON', // Ontario
        M: 'ON', // Ontario
        N: 'ON', // Ontario
        P: 'ON', // Ontario
        R: 'MB', // Manitoba
        S: 'SK', // Saskatchewan
        T: 'AB', // Alberta
        V: 'BC', // British Columbia
        X: 'NT', // Northwest Territories (also covers Nunavut, but we'll default to NT)
        Y: 'YT', // Yukon
    };

    return provinceMap[firstLetter];
}

export function getStateCodeByPostalCode(countryCode: string, postalCode: string): string | undefined {
    switch (countryCode) {
        case 'US':
            return getStateCodeByUSPostalCode(postalCode);
        case 'CA':
            return getStateCodeByCanadianPostalCode(postalCode);
    }
}
