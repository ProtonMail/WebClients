export type AutoFillSettings = { inject: boolean; openOnFocus: boolean };
export type AutoSaveSettings = { prompt: boolean; shareId?: string };
export type AutoSuggestSettings = { password: boolean; email: boolean };

export type CriteriaMask = number;
export type CriteriaMasks = keyof typeof CRITERIA_MASKS;
export type DomainCriterias = Record<string, CriteriaMask>;

export const CRITERIA_MASKS = {
    Autofill: 1 << 0,
    Autofill2FA: 1 << 1,
    Autosuggest: 1 << 2,
    Autosave: 1 << 3,
};

export const CRITERIAS_SETTING_CREATE = Object.values(CRITERIA_MASKS).reduce((acc, curr) => acc ^ curr, 0);
