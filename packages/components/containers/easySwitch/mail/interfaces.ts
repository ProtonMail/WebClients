import {
    MailImporterPayload,
    ImportedMailFolder,
    TIME_PERIOD,
    ImportType,
} from '@proton/shared/lib/interfaces/EasySwitch';

export enum MailImportStep {
    START,
    PREPARE,
    STARTED,
    INSTRUCTIONS,
}

export interface ImportMailModalModel {
    providerFolders: ImportedMailFolder[];
    step: MailImportStep;
    needIMAPDetails: boolean;
    importID: string;
    email: string;
    password: string;
    port: string;
    imap: string;
    errorCode: number;
    errorLabel: string;
    selectedPeriod: TIME_PERIOD;
    payload: MailImporterPayload;
    isPayloadInvalid: boolean;
}

export enum AuthenticationMethod {
    PLAIN = 'PLAIN',
    OAUTH = 'XOAUTH2',
}

/* @todo to be deprecated */
export enum ImportMailReportStatus {
    QUEUED = 0,
    RUNNING = 1,
    DONE = 2,
    FAILED = 3,
    PAUSED = 4,
    CANCELED = 5,
    DELAYED = 6,
}

/* @todo to be deprecated */
export interface ImportHistory {
    ID: string;
    Email: string;
    CreateTime: number;
    EndTime: number;
    NumMessages: number;
    State: ImportMailReportStatus;
    TotalSize: number;
    CanDeleteSource: number;
    Product?: ImportType;
}

export interface CheckedFoldersMap {
    [key: string]: boolean;
}

export interface DisabledFoldersMap {
    [key: string]: boolean;
}

export interface FolderRelationshipsMap {
    [key: string]: string[];
}

export interface FolderNamesMap {
    [key: string]: string;
}

export interface EditModeMap {
    [key: string]: boolean;
}

export interface FolderPathsMap {
    [key: string]: string;
}

export interface LabelsMap {
    [key: string]: {
        Name: string;
        Color: string;
    };
}
