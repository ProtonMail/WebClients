export type AutoFillSettings = {
    inject: boolean;
    openOnFocus: boolean;
};

export type AutoSaveSettings = {
    prompt: boolean;
};

export type AutoSuggestSettings = {
    password: boolean;
    email: boolean;
};

export enum DisallowedAutoCriteria {
    AUTOFILL = 'noAutoFill',
    AUTOSAVE = 'noAutoSave',
    AUTOSUGGESTION = 'noAutoSuggestion',
    AUTO2FA = 'noAuto2FA',
}

export type DisallowedAutoDomainsSettings = { [key in DisallowedAutoCriteria]: string[] };
