import { hasCriteria } from '@proton/pass/lib/settings/criteria';
import type { MaybeNull } from '@proton/pass/types';
import type { CriteriaMasks, DomainCriterias } from '@proton/pass/types/worker/settings';
import type { ParsedUrl } from '@proton/pass/utils/url/types';

type PauseCriteriaParams = { disallowedDomains: DomainCriterias; url?: MaybeNull<ParsedUrl> };

export const hasPauseCriteria = ({ disallowedDomains, url }: PauseCriteriaParams): Record<CriteriaMasks, boolean> => {
    /* merge domain and subdomain masks if we have both in the pause-list */
    const domainMask = url?.domain ? disallowedDomains[url.domain] : 0;
    const subDomainMask = url?.subdomain ? disallowedDomains[url.subdomain] : 0;
    const mask = domainMask | subDomainMask;

    return {
        Autofill: hasCriteria(mask, 'Autofill'),
        Autofill2FA: hasCriteria(mask, 'Autofill2FA'),
        Autosave: hasCriteria(mask, 'Autosave'),
        Autosuggest: hasCriteria(mask, 'Autosuggest'),
        Passkey: hasCriteria(mask, 'Passkey'),
    };
};
