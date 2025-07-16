/** International Top-Level Domains (TLDs) commonly used by global websites.
 * Enables domain expansion for internationalization (e.g., `amazon.{i18n-tld}`)
 * into major regional variants. */
export const I18N_TLDS = [
    'ae', // United Arab Emirates
    'be', // Belgium
    'ca', // Canada
    'cn', // China
    'co.jp', // Japan
    'co.uk', // United Kingdom
    'co.za', // South Africa
    'com.au', // Australia
    'com.be', // Belgium
    'com.br', // Brazil
    'com.mx', // Mexico
    'com.sa', // Saudi Arabia
    'com.tr', // Turkey
    'com', // USA
    'de', // Germany
    'es', // Spain
    'fr', // France
    'ie', // Ireland
    'in', // India
    'it', // Italy
    'nl', // Netherlands
    'pl', // Poland
    'sa', // Saudi Arabia
    'se', // Sweden
    'sg', // Singapore
] as const;

export const I18N_TLD_FLAG = `i18n-tld`;
