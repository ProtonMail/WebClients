export interface ChecklistApiResponse {
    Code: number;
    Items: ChecklistKey[];
    CreatedAt: number;
    ExpiresAt: number;
    UserWasRewarded: boolean;
    Visible: boolean;
    Display: CHECKLIST_DISPLAY_TYPE;
}

export type ChecklistId = 'get-started' | 'paying-user' | 'byoe-user';

export enum ChecklistType {
    MailFreeUser = 1,
    MailPaidUser = 2,
    DriveUser = 3,
    MailBYOEUser = 4,
}

export enum ChecklistKey {
    SendMessage = 'SendMessage',
    RecoveryMethod = 'RecoveryMethod',
    DriveUpload = 'DriveUpload',
    DriveShare = 'DriveShare',

    // New checklist items
    Import = 'Import',
    ProtectInbox = 'ProtectInbox',
    AccountLogin = 'AccountLogin',
    MobileApp = 'MobileApp',

    // BYOE specific
    ClaimAddress = 'ClaimAddress',
}

export type ChecklistKeyType = keyof typeof ChecklistKey;

export enum CHECKLIST_DISPLAY_TYPE {
    FULL = 'Full',
    REDUCED = 'Reduced',
    HIDDEN = 'Hidden',
}
