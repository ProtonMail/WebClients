export * from 'pmcrypto-v6-canary/lib/bigInteger';

/**
 * Get this value as an exact Number (max 53 bits)
 * Fails if this value is too large
 * @throws if input is larger than `Number.MAX_SAFE_INTEGER`
 */
export function bigIntToNumber(x: bigint) {
    if (x > BigInt(Number.MAX_SAFE_INTEGER)) {
        throw new Error('Number can only safely store up to 53 bits');
    }
    return Number(x);
}
