/**
 * ⚠️ `CryptoProxy.computeHash` should be used instead of this helper
 * in contexts where the CryptoProxy is available.
 * NB: depending on the browser this hash computation may be run in the main thread, which
 * will cause UX degradation when hashing large data
 * @param data
 * @returns
 */
export const computeSHA256 = async (data: Uint8Array<ArrayBuffer>) => {
    const digestBuffer = await crypto.subtle.digest('SHA-256', data);
    return new Uint8Array(digestBuffer);
};
