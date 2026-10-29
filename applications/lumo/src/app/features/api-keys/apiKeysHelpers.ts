import { c } from 'ttag';

import { getCurrencyFormattingConfig } from '@proton/payments/core/currencies';
import type { Currency } from '@proton/payments/core/interface';
import { CryptoProxy } from '@protontech/crypto';
import type { PublicKeyReference } from '@protontech/crypto';

export const EXPIRATION_OPTIONS = [
    { value: '30', text: c('collider_2025: Option').t`30 days` },
    { value: '90', text: c('collider_2025: Option').t`90 days` },
    { value: '180', text: c('collider_2025: Option').t`180 days` },
    { value: '365', text: c('collider_2025: Option').t`1 year` },
];

const EXPIRING_SOON_THRESHOLD = 7 * 86400;

export const getExpirationTimestamp = (days: number) => Math.floor(Date.now() / 1000) + days * 86400;

export const formatDate = (unixTs: number) =>
    new Date(unixTs * 1000).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

export const getDaysRemaining = (unixTs: number) => {
    const diff = unixTs - Math.floor(Date.now() / 1000);
    return Math.ceil(diff / 86400);
};

export async function buildPersonalAccessTokenKey(publicKey: PublicKeyReference): Promise<string> {
    const tokenKeyBytes = crypto.getRandomValues(new Uint8Array(32));
    const encrypted = await CryptoProxy.encryptMessage({
        binaryData: tokenKeyBytes,
        encryptionKeys: publicKey,
        format: 'binary',
    });
    return encrypted.message.toBase64();
}

export type TokenStatus = 'active' | 'expiring' | 'expired';

export const getTokenStatus = (expireTime: number): TokenStatus => {
    const now = Math.floor(Date.now() / 1000);
    if (expireTime < now) return 'expired';
    if (expireTime - now < EXPIRING_SOON_THRESHOLD) return 'expiring';
    return 'active';
};

export const formatTokenCount = (n: number): string => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
    return String(n);
};

/** Formats an amount in major currency units (e.g. 12.5 → "CHF 12.50"). */
export const formatApiCurrency = (value: number, currency: Currency) =>
    new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(value);

export const toCurrencyBaseUnits = (amount: number, currency: Currency) =>
    amount * getCurrencyFormattingConfig(currency).divisor;

/** Parses a user-entered amount; returns null for empty, non-numeric, or negative input. */
export const parseApiAmount = (value: string): number | null => {
    if (value.trim() === '') {
        return null;
    }
    const amount = Number(value);
    return Number.isFinite(amount) && amount >= 0 ? amount : null;
};

export const shortDayLabel = (isoDate: string) =>
    new Date(isoDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

/** 30 placeholder points for empty sparkline */
export const GHOST_DATA = [3, 5, 7, 4, 8, 6, 3, 5, 9, 4, 7, 6, 3, 8, 5, 4, 7, 3, 6, 9, 4, 5, 8, 3, 7, 6, 4, 8, 5, 7].map(
    (v, i) => ({ Date: String(i), TokenCount: v })
);
