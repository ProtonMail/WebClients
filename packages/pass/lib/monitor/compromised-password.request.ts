import { CryptoProxy } from '@protontech/crypto';
import { utf8StringToUint8Array } from '@protontech/crypto/utils';

import { PASS_CREDENTIAL_CHECK_URL } from '@proton/pass/constants';

/** Only a truncated prefix of this hash (see `getBucketUrl`) is ever sent
 * anywhere — the password itself and the full hash never leave the device. */
export const hashPassword = async (password: string): Promise<string> => {
    const data = utf8StringToUint8Array(password);
    const hash = await CryptoProxy.computeHash({ algorithm: 'unsafeSHA1', data });
    return hash.toHex();
};

/** e.g. `5baa61e4c9b93f3f0682250b6cf8331b7ee68fd8` ->
 * `https://credential-check.protonweb.com/split/sha1/5B/AA/61/5BAA61.gz` */
export const getBucketUrl = (hashHex: string): string => {
    const prefix = hashHex.slice(0, 6).toUpperCase();
    const a = prefix.slice(0, 2);
    const b = prefix.slice(2, 4);
    const c = prefix.slice(4, 6);
    return `${PASS_CREDENTIAL_CHECK_URL}/split/sha1/${a}/${b}/${c}/${prefix}.gz`;
};

/** Each line is `SUFFIX:COUNT` (34 uppercase hex chars, the remainder of the
 * SHA1 hash after the 6-char prefix used for the bucket path, followed by an
 * occurrence count) — same shape as HIBP's own range API. The count isn't
 * needed here, only suffix membership. */
export const fetchCompromisedBucket = async (hashHex: string): Promise<Set<string>> => {
    const res = await fetch(getBucketUrl(hashHex));
    if (res.status === 404) return new Set();
    if (!res.ok || !res.body) throw new Error(`Failed to fetch compromised password bucket: ${res.status}`);

    const decompressed = res.body.pipeThrough(new DecompressionStream('gzip'));
    const text = await new Response(decompressed).text();

    const suffixes = new Set<string>();
    for (const line of text.split('\n')) {
        const suffix = line.split(':', 1)[0]?.trim().toUpperCase();
        if (suffix) suffixes.add(suffix);
    }

    return suffixes;
};

/** Only the 6-char bucket prefix is sent anywhere, as part of the bucket
 * file's URL — never the full hash or the plaintext password. */
export const isPasswordCompromised = async (password: string): Promise<boolean> => {
    const hashHex = (await hashPassword(password)).toUpperCase();
    const suffix = hashHex.slice(6);
    const suffixes = await fetchCompromisedBucket(hashHex);
    return suffixes.has(suffix);
};
