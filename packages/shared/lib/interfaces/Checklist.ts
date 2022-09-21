export interface ChecklistApiResponse {
    Code: number;
    Items: ChecklistKey[];
    CreatedAt: number;
    ExpiresAt: number;
    UserWasRewarded: boolean;
    Visible: boolean;
}

export type ChecklistId = 'get-started' | 'paying-user';

export enum ChecklistKey {
    SendMessage = 'SendMessage',
    MobileApp = 'MobileApp',
    RecoveryMethod = 'RecoveryMethod',
    Import = 'Import',
    DriveUpload = 'DriveUpload',
    DriveShare = 'DriveShare',
}
