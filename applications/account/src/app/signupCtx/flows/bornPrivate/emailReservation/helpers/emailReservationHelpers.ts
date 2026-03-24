import { getDefaultMainCurrencyByCountryCode } from '@proton/payments/core/currencies';
import type { Currency } from '@proton/payments/core/interface';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { APPS } from '@proton/shared/lib/constants';

export enum ErrorTypes {
    paymentError = 'payment',
    postAccountCreationError = 'post-account-creation',
}

/** Base32 alphabet (0-9, A-Z excluding I, L, O, U) to avoid confusing characters */
const BASE32_CHARS = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

/**
 * Generates 16 base32 characters, hyphenated every 4 and uppercase.
 * Example: "9K7Q-P6HD-X28R-G5YV"
 */
export const generateReadableActivationCode = (): string => {
    const randomValues = crypto.getRandomValues(new Uint8Array(16));
    return Array.from(randomValues)
        .map((n, i) => (i > 0 && i % 4 === 0 ? '-' : '') + BASE32_CHARS[n % BASE32_CHARS.length])
        .join('');
};

export const getActivationUrl = (reservedEmail: string, activationCode: string) => {
    const payload = `reservedEmail=${encodeURIComponent(reservedEmail)}&activationCode=${encodeURIComponent(activationCode)}`;
    const bytes = new TextEncoder().encode(payload);
    const encodedBase64 = bytes.toBase64();
    return getAppHref(`/born-private/activate#${encodedBase64}`, APPS.PROTONACCOUNT);
};

export const DONATION_CURRENCIES: readonly Currency[] = ['USD', 'GBP', 'EUR'];

export const getDonationCurrency = (countryCode: string | undefined): Currency => {
    if (countryCode === 'GB') {
        return 'GBP';
    }

    const currency = getDefaultMainCurrencyByCountryCode(countryCode);

    if (currency === 'CHF') {
        return 'EUR';
    }

    if (DONATION_CURRENCIES.includes(currency)) {
        return currency;
    }

    return 'USD';
};
