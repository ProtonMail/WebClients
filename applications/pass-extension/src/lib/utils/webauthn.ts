import { sendSafariMessage } from 'proton-pass-extension/lib/utils/safari';

import type { MaybeNull } from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';

type RelatedOrigins = { origins: string[]; finalUrl?: string };
type RelatedOriginsNativeResponse = { body: string; status: number; finalUrl: string } | { error: string };

const browserWebauthnFetcher = async (url: string): Promise<MaybeNull<RelatedOrigins>> => {
    const res = await fetch(url, { credentials: 'omit', referrerPolicy: 'no-referrer' });
    if (!res.ok) return null;

    const json = await res.json();
    if (!Array.isArray(json.origins)) return null;

    return { origins: json.origins, finalUrl: res.url };
};

/** NOTE: Safari classifies extension-initiated fetches as `Sec-Fetch-Site: cross-site`,
 * which RPs running with Fetch-Metadata isolation policy reject (HTTP 400).
 * Route through the native host (`URLSession`), which sends no `Sec-Fetch-*`. */
const nativeWebauthnFetcher = async (url: string): Promise<MaybeNull<RelatedOrigins>> => {
    const raw = await sendSafariMessage<string>({ fetchRelatedOrigins: { url } });
    if (!raw) return null;

    const res = JSON.parse(raw) as RelatedOriginsNativeResponse;
    if ('error' in res || res.status < 200 || res.status >= 300) return null;

    const json = JSON.parse(res.body);
    if (!Array.isArray(json.origins)) return null;
    return { origins: json.origins, finalUrl: res.finalUrl };
};

/** Fetches `/.well-known/webauthn` when the RP ID doesn't match the request
 * origin. Per the WebAuthn spec, a relying party can authorize cross-origin
 * credential use by listing allowed origins in this well-known file. The rust
 * library calls this fetcher, and checks whether the request origin appears in
 * the returned `origins` array before permitting the operation. `finalUrl` is
 * forwarded so the library can validate the redirect chain.
 * Spec: https://www.w3.org/TR/webauthn-3/#sctn-related-origins */
export const webauthnFetcher = async (url: string): Promise<RelatedOrigins> => {
    const fetcher = BUILD_TARGET === 'safari' ? nativeWebauthnFetcher : browserWebauthnFetcher;
    logger.info(`[WebAuthnFetcher] Fetching ${url} related origins`);

    const res = await fetcher(url).catch((err) => {
        logger.error(`[WebAuthnFetcher] Request failure`, err);
        return null;
    });

    return res ?? { origins: [] };
};
