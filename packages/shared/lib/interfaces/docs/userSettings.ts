export interface UserSettings {
    DocsCommentsNotificationsIncludeDocumentName: boolean;
    DocsCommentsNotificationsEnabled: boolean;
}

export interface UserSettingsResponse {
    UserSettings: { [K in keyof UserSettings]: UserSettings[K] | null };
    Defaults: {
        DocsCommentsNotificationsIncludeDocumentName: UserSettings['DocsCommentsNotificationsIncludeDocumentName'];
        DocsCommentsNotificationsEnabled: UserSettings['DocsCommentsNotificationsEnabled'];
    };
}
