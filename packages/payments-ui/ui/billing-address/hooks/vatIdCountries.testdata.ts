// Single source of truth for the countries that must render the VAT id input across all VAT tests.
// Intentionally hand-maintained and independent of countriesWithVatNumberOnSignup: the drift test in
// countriesWithVatId.test.ts asserts the two stay in sync, so this list is what catches the set
// silently losing (or gaining) a country.
export const EXPECTED_VAT_ID_COUNTRIES = [
    // EU member states (27)
    'AT',
    'BE',
    'BG',
    'HR',
    'CY',
    'CZ',
    'DK',
    'EE',
    'FI',
    'FR',
    'DE',
    'GR',
    'HU',
    'IE',
    'IT',
    'LV',
    'LT',
    'LU',
    'MT',
    'NL',
    'PL',
    'PT',
    'RO',
    'SK',
    'SI',
    'ES',
    'SE',

    // Additional non-EU European countries
    'CH',
    'GB',
    'NO',
    'LI',
    'IS',

    // Countries for Batch 1 tax exclusive
    'AU',
    'SG',
];
