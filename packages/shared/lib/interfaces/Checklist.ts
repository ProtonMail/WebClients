export interface ChecklistApiResponse {
    Code: number;
    Items: ChecklistKey[];
    CreatedAt: number;
    ExpiresAt: number;
    UserWasRewarded: boolean;
    Visible: boolean;
    Display: CHECKLIST_DISPLAY_TYPE;
}

export type ChecklistId = 'get-started' | 'paying-user';

export enum ChecklistKey {
    SendMessage = 'SendMessage',
    RecoveryMethod = 'RecoveryMethod',
    DriveUpload = 'DriveUpload',
    DriveShare = 'DriveShare',

    //New checklist items
    Import = 'Import',
    ProtectInbox = 'ProtectInbox',
    AccountLogin = 'AccountLogin',
    MobileApp = 'MobileApp',
}

export type ChecklistKeyType = keyof typeof ChecklistKey;

export enum CHECKLIST_DISPLAY_TYPE {
    FULL = 'Full',
    REDUCED = 'Reduced',
    HIDDEN = 'Hidden',
}
