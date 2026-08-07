import { uint8ArrayToUtf8String } from '@protontech/crypto/utils';

import logger from '../../logger';
import type { SerializedUrlRule } from './builder';

/**
 * Evaluates if the given url string matches the rules.
 *
 * Order does matter: the first matching rule wins, so more specific rules must be registered before catch-all ones.
 *
 * Patterns are matched against `${url.origin}${url.pathname}` (query string and fragment are
 * excluded); query params and hash params are handled separately via `searchParamsAnyOf` and `hashParamsAnyOf`.
 */
export const matchUrlRules = (urlString: string, rules: SerializedUrlRule[]): boolean => {
    let url: URL;
    try {
        url = new URL(urlString);
    } catch {
        logger.warn('Failed to parse URL', { url: urlString });
        return false;
    }

    const target = `${url.origin}${url.pathname}`;

    for (const rule of rules) {
        if (!rule.regex.test(target)) {
            continue;
        }

        if (rule.searchParamsAnyOf?.length && !rule.searchParamsAnyOf.some((name) => url.searchParams.has(name))) {
            continue;
        }

        if (
            rule.hashParamsAnyOf?.length &&
            !rule.hashParamsAnyOf.some((name) => {
                const encodedHash = url.hash.slice(1);
                let decodedHash = '';
                try {
                    decodedHash = uint8ArrayToUtf8String(Uint8Array.fromBase64(encodedHash, { alphabet: 'base64url' }));
                } catch {}
                const hashParams = new URLSearchParams(decodedHash);
                return hashParams.has(name);
            })
        ) {
            continue;
        }

        logger.info('URL rule matches', { url: urlString, rule: rule.id });
        return true;
    }

    return false;
};
