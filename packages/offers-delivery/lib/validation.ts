import { isSubDomain } from '@proton/shared/lib/helpers/url';

import type { MaybeNull } from '../interface';

/** Only absolute https URLs, no embedded credentials. Rejects `javascript:`,
 * `data:`, `http:`, protocol-relative URLs, and `user:pass@host`. */
export const sanitizeHttpsUrl = (value: MaybeNull<string> | undefined): MaybeNull<string> => {
    if (value === null || value === undefined || value === '') {
        return null;
    }

    try {
        const url = new URL(value);
        if (url.protocol !== 'https:' || url.username !== '' || url.password !== '') {
            return null;
        }
        return url.href;
    } catch {
        return null;
    }
};

/** Beyond the https check, so a compromised backend can't beacon the user's
 * IP/Referer to a third-party host via `<img src>`. */
const PROTON_CDN_HOSTS = ['proton.me', 'proton.black', 'proton.pink'];

export const sanitizeImageUrl = (value: MaybeNull<string> | undefined): MaybeNull<string> => {
    const url = sanitizeHttpsUrl(value);
    if (url === null) {
        return null;
    }

    const { hostname } = new URL(url);
    return PROTON_CDN_HOSTS.some((host) => isSubDomain(hostname, host)) ? url : null;
};
