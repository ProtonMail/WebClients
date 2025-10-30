import { hasCriteria } from '@proton/pass/lib/settings/criteria';
import type { MaybeNull } from '@proton/pass/types';
import type { CriteriaMasks, DomainCriterias } from '@proton/pass/types/worker/settings';
import type { ParsedUrl } from '@proton/pass/utils/url/types';

type PauseCriteriaParams = { disallowedDomains: DomainCriterias; url?: MaybeNull<ParsedUrl> };
type PauseCriterias = Record<CriteriaMasks, boolean>;

export const DEFAULT_PAUSE_CRITERIAS: PauseCriterias = {
    Autofill: false,
    Autofill2FA: false,
    Autosave: false,
    Autosuggest: false,
    Passkey: false,
};

export const hasPauseCriteria = ({ disallowedDomains, url }: PauseCriteriaParams): PauseCriterias => {
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

export const combinePauseCriteria = (a: PauseCriterias, b: PauseCriterias): PauseCriterias => ({
    Autofill: a.Autofill || b.Autofill,
    Autofill2FA: a.Autofill2FA || b.Autofill2FA,
    Autosave: a.Autosave || b.Autosave,
    Autosuggest: a.Autosuggest || b.Autosuggest,
    Passkey: a.Passkey || b.Passkey,
});
