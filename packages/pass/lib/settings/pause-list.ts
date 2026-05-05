import type { Maybe, MaybeNull, OrganizationUrlPauseEntryDto } from '@proton/pass/types';
import type { ParsedUrl } from '@proton/pass/utils/url/types';
import { intoCleanHostname } from '@proton/pass/utils/url/utils';

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

export type PauseCriteriaParams = {
    disallowedDomains: DomainCriterias;
    orgDomains?: DomainCriterias;
    url?: MaybeNull<ParsedUrl>;
};
export type PauseCriterias = Record<CriteriaMasks, boolean>;

export const DEFAULT_PAUSE_CRITERIAS: PauseCriterias = {
    Autofill: false,
    Autofill2FA: false,
    Autosave: false,
    Autosuggest: false,
    Passkey: false,
};

export const hasPauseCriteria = ({ disallowedDomains, orgDomains, url }: PauseCriteriaParams): PauseCriterias => {
    /* merge domain and subdomain masks if we have both in the pause-list */
    const domainMask = url?.domain ? disallowedDomains[url.domain] | (orgDomains?.[url.domain] ?? 0) : 0;
    const subDomainMask = url?.subdomain ? disallowedDomains[url.subdomain] | (orgDomains?.[url.subdomain] ?? 0) : 0;
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

export const intoPauseCriterias = (entries: OrganizationUrlPauseEntryDto[]): DomainCriterias => {
    const result: DomainCriterias = {};

    for (const { Url, Values } of entries) {
        const hostname = intoCleanHostname(Url);
        if (!hostname) continue;
        let mask = 0;
        if (!Values.AutofillEnabled) mask |= CRITERIA_MASKS.Autofill;
        if (!Values.Autofill2faEnabled) mask |= CRITERIA_MASKS.Autofill2FA;
        if (!Values.AutofillAutosuggestEnabled) mask |= CRITERIA_MASKS.Autosuggest;
        if (!Values.AutosaveEnabled) mask |= CRITERIA_MASKS.Autosave;
        if (!Values.PasskeysEnabled) mask |= CRITERIA_MASKS.Passkey;
        if (mask > 0) result[hostname] = mask;
    }

    return result;
};

export const mergePauseCriterias = (a: DomainCriterias, b: DomainCriterias): DomainCriterias => {
    const result = { ...a };
    for (const [hostname, mask] of Object.entries(b)) {
        result[hostname] = (result[hostname] ?? 0) | mask;
    }
    return result;
};
