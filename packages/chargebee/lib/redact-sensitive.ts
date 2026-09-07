const SENSITIVE_KEYS = new Set([
    // Identity
    'email',
    'firstname',
    'lastname',
    'username',
    'name',
    'company',
    'userid',
    'uid',
    'phone',
    'phonenumber',
    // Location
    'addressline',
    'addressline1',
    'addressline2',
    'zip',
    'zipcode',
    'postcode',
    'postalcode',
    // Bank and card details. None of these reach us today — Chargebee handles card data and it
    // never passes through this iframe — but listing them costs nothing and settles the question.
    'iban',
    'bic',
    'accountnumber',
    'bin',
    'last4',
    'cardnumber',
    'cvc',
    'cvv',
    'expiry',
]);

/**
 * Keys here are replaced with `DROPPED`: large, and never once useful in working out a failure.
 * Nothing about them is private. The separate marker stops a report from reading as if a theme
 * colour had been hidden for privacy.
 */
const NOISY_KEYS = new Set(['cssvariables', 'translations']);

export const REDACTED = '[redacted]';

export const DROPPED = '[dropped]';

function normalizeKey(key: string): string {
    return key.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function isSensitiveKey(key: string): boolean {
    return SENSITIVE_KEYS.has(normalizeKey(key));
}

function isNoisyKey(key: string): boolean {
    return NOISY_KEYS.has(normalizeKey(key));
}

const MAX_DEPTH = 8;

function replacementFor(key: string): string | null {
    if (isSensitiveKey(key)) {
        return REDACTED;
    }

    if (isNoisyKey(key)) {
        return DROPPED;
    }

    return null;
}

export function redactSensitive(value: unknown, depth = 0): unknown {
    if (depth > MAX_DEPTH) {
        return '[depth limit]';
    }

    if (Array.isArray(value)) {
        return value.map((item) => redactSensitive(item, depth + 1));
    }

    if (value === null || typeof value !== 'object') {
        return value;
    }

    const redacted: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) {
        const replacement = replacementFor(key);
        redacted[key] = replacement ?? redactSensitive(item, depth + 1);
    }

    return redacted;
}

export function toRedactedJson(value: unknown): string {
    try {
        return JSON.stringify(redactSensitive(value)) ?? 'undefined';
    } catch (error: any) {
        return `[unserializable: ${error?.message ?? 'unknown'}]`;
    }
}
