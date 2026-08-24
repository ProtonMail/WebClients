import { CryptoProxy } from '@protontech/crypto';
import { utf8StringToUint8Array } from '@protontech/crypto/utils';

import { PASS_CREDENTIAL_CHECK_URL } from '../../constants';

/** Only a truncated prefix of this hash (see `getBucketUrl`) is ever sent
 * anywhere — the password itself and the full hash never leave the device. */
export const hashPassword = async (password: string): Promise<string> => {
    const data = utf8StringToUint8Array(password);
    const hash = await CryptoProxy.computeHash({ algorithm: 'unsafeSHA1', data });
    return hash.toHex();
};

export const getBucketUrl = (hashHex: string): string => {
    const prefix = hashHex.slice(0, 6).toUpperCase();
    const a = prefix.slice(0, 2);
    const b = prefix.slice(2, 4);
    const c = prefix.slice(4, 6);
    return `${PASS_CREDENTIAL_CHECK_URL}/split/sha1/${a}/${b}/${c}/${prefix}.gz`;
};

/** Global "has anything in the whole corpus changed" marker */
export const getLastChangeTimestamp = async (): Promise<number> => {
    const res = await fetch(`${PASS_CREDENTIAL_CHECK_URL}/split/sha1/last_change`);
    if (!res.ok) throw new Error(`Failed to fetch last_change: ${res.status}`);

    const raw = (await res.text()).trim();
    const timestamp = Number(raw);
    if (!raw || !Number.isFinite(timestamp) || timestamp <= 0) throw new Error('Invalid last_change response');
    return timestamp;
};

export type BucketResult = { status: 'not-modified' } | { status: 'ok'; etag: string; suffixes: Set<string> };

export const fetchCompromisedBucket = async (hashHex: string, priorEtag?: string): Promise<BucketResult> => {
    const headers: HeadersInit = { 'Add-Padding': 'true', ...(priorEtag ? { 'If-None-Match': priorEtag } : {}) };
    const res = await fetch(getBucketUrl(hashHex), { headers });

    if (res.status === 304) return { status: 'not-modified' };
    if (res.status === 404) return { status: 'ok', etag: '', suffixes: new Set() };
    if (!res.ok || !res.body) throw new Error(`Failed to fetch compromised password bucket: ${res.status}`);

    const etag = res.headers.get('etag') ?? '';
    const decompressed = res.body.pipeThrough(new DecompressionStream('gzip'));
    const text = await new Response(decompressed).text();

    const suffixes = new Set<string>();
    for (const line of text.split('\n')) {
        const suffix = line.split(':', 1)[0]?.trim().toUpperCase();
        if (suffix) suffixes.add(suffix);
    }

    return { status: 'ok', etag, suffixes };
};

export type CompromisedCheckResult =
    { status: 'not-modified' } | { status: 'checked'; compromised: boolean; etag: string };

export const checkPasswordCompromised = async (
    password: string,
    priorEtag?: string
): Promise<CompromisedCheckResult> => {
    const hashHex = (await hashPassword(password)).toUpperCase();
    const suffix = hashHex.slice(6);
    const bucket = await fetchCompromisedBucket(hashHex, priorEtag);

    if (bucket.status === 'not-modified') return { status: 'not-modified' };
    return { status: 'checked', compromised: bucket.suffixes.has(suffix), etag: bucket.etag };
};
