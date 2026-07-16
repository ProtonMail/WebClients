import { getHostname } from '@proton/components/helpers/url';
import { PROTON_DOMAINS } from '@proton/shared/lib/constants';
import { isSubDomain } from '@proton/shared/lib/helpers/url';

export const isTrustedProtonLink = (url: string): boolean => {
    try {
        const hostname = getHostname(url);
        return PROTON_DOMAINS.some((domain) => isSubDomain(hostname, domain));
    } catch {
        return false;
    }
};

export const openTrustedLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
};
