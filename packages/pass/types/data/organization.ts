export const enum SettingMode {
    UNLIMITED = 0,
    LIMITED = 1,
}

export interface OrganizationSettings {
    shareMode: SettingMode;
    exportMode: SettingMode;
}

export interface OrganizationSettingsResponse {
    CanUpdate: boolean;
    Settings: {
        ShareMode: SettingMode;
        ExportMode: SettingMode;
    };
}
