export enum SortSetting {
    NameAsc = 1,
    SizeAsc = 2,
    ModifiedAsc = 4,
    NameDesc = -1,
    SizeDesc = -2,
    ModifiedDesc = -4,
}

export enum LayoutSetting {
    List = 0,
    Grid = 1,
}

export type RevisionRetentionDaysSetting = 0 | 7 | 30 | 180 | 365 | 3650;

export interface UserSettings {
    Sort: SortSetting;
    Layout: LayoutSetting;
    RevisionRetentionDays: RevisionRetentionDaysSetting;
}
