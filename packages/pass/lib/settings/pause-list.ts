import type { Maybe, MaybeNull } from '@proton/pass/types';
import type { ParsedUrl } from '@proton/pass/utils/url/types';

export type PauseListEntry = { hostname: string; criteria: CriteriaMasks };
export type CriteriaMask = number;
export type CriteriaMasks = keyof typeof CRITERIA_MASKS;
export type DomainCriterias = Record<string, CriteriaMask>;

export const CRITERIA_MASKS = {
    Autofill: 1 << 0,
    Autofill2FA: 1 << 1,
    Autosuggest: 1 << 2,
    Autosave: 1 << 3,
    Passkey: 1 << 4,
};

export const CRITERIAS_SETTING_CREATE = Object.values(CRITERIA_MASKS).reduce((acc, curr) => acc ^ curr, 0);

export const toggleCriteria = (setting: number, criteria: CriteriaMasks) =>
    (setting = setting ^ CRITERIA_MASKS[criteria]);

export const hasCriteria = (setting: Maybe<number>, criteria: CriteriaMasks) =>
    ((setting ?? 0) & CRITERIA_MASKS[criteria]) !== 0;

export type PauseCriteriaParams = { disallowedDomains: DomainCriterias; url?: MaybeNull<ParsedUrl> };
export type PauseCriterias = Record<CriteriaMasks, boolean>;

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
