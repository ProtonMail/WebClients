export type AutoFillSettings = { inject: boolean; openOnFocus: boolean };
export type AutoSaveSettings = { prompt: boolean };
export type AutoSuggestSettings = { password: boolean; email: boolean };

export type CriteriaMask = number;
export type DisallowCritera = keyof typeof DisallowCriteriaMasks;
export type DisallowedDomains = Record<string, CriteriaMask>;

export const DisallowCriteriaMasks = {
    Autofill: 1 << 0,
    Autofill2FA: 1 << 1,
    Autosuggest: 1 << 2,
    Autosave: 1 << 3,
};
