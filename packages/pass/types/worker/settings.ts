export type AutoFillSettings = {
    /** Removal optional after 1.24.0 */
    login?: boolean;
    identity: boolean;
    twofa: boolean;
    basicAuth?: boolean;
    cc?: boolean;
    /** @deprecated Kept for >=1.24.0 migrations */
    inject?: boolean;
    /** @deprecated Kept for >=1.24.0 migrations */
    openOnFocus?: boolean;
};

export type AutoSaveSettings = { prompt: boolean; shareId?: string; passwordSuggest: boolean };
export type AutoSuggestSettings = { password: boolean; email: boolean; passwordCopy: boolean };
export type PasskeySettings = { create: boolean; get: boolean };

export type OfflineModeDTO = { loginPassword: string; enabled: boolean };
