import { ApiResponse } from '@proton/shared/lib/interfaces';

import { ImportType } from './shared.types';

export enum ApiMailImportDestinationFolder {
    INBOX = 'Inbox',
    ALL_DRAFTS = 'All Drafts',
    ALL_SENT = 'All Sent',
    TRASH = 'Trash',
    SPAM = 'Spam',
    ALL_MAIL = 'All Mail',
    STARRED = 'Starred',
    ARCHIVE = 'Archive',
    SENT = 'Sent',
    DRAFTS = 'Drafts',
}

export enum ApiReportRollbackState {
    CANNOT_ROLLBACK = 0,
    CAN_ROLLBACK = 1,
    ROLLING_BACK = 2,
    ROLLED_BACK = 3,
}

export enum ApiImporterState {
    QUEUED = 0,
    RUNNING = 1,
    DONE = 2,
    FAILED = 3,
    PAUSED = 4,
    CANCELED = 5,
    DELAYED = 6,
}

/**
 * Payload changes depending of the import type (Contacts, Mail, Calendar)
 * This is just the list of the common fields
 * Please look at API docs to find more infos
 */
export interface ApiReportSummary {
    State: ApiImporterState;
    TotalSize: number;
    RollbackState?: ApiReportRollbackState;
}

export enum ApiImportProvider {
    IMAP = 0,
    GOOGLE = 1,
    OUTLOOK = 2,
}

export enum ApiReportState {
    UNSENT = 0,
    SENT = 1,
}

export interface ApiReport {
    ID: string;
    CreateTime: number;
    EndTime: number;
    Provider: ApiImportProvider;
    /** Email */
    Account: string;
    State: ApiReportState;
    Summary: Partial<Record<ImportType, ApiReportSummary>>;
    TotalSize: number;
}

/**
 * importer/v1/reports
 */
export interface ApiImportReportListResponse extends ApiResponse {
    Reports: ApiReport[];
}

export enum ApiImporterError {
    ERROR_CODE_IMAP_CONNECTION = 1,
    ERROR_CODE_QUOTA_LIMIT = 2,
}

export interface ApiImporterFolder {
    SourceFolder: string;
    DestinationFolder?: ApiMailImportDestinationFolder;
    Processed: number;
    Total: number;
}

export interface ApiImporterActive {
    CreateTime: number;
    State: ApiImporterState;
    ErrorCode?: ApiImporterError;
    Mapping?: ApiImporterFolder[];
    Processed?: number;
    Total?: number;
}

/**
 * TODO: Change typing depending on IMAP or OAUTH context
 */
export interface ApiImporter {
    ID: string;
    /** Only on IMAP flow */
    TokenID?: string;
    Account: string;
    Provider: ApiImportProvider;
    Product: ImportType[];
    Active?: Partial<Record<ImportType, ApiImporterActive>>;
    /** Only on IMAP flow */
    ImapHost?: string;
    /** Only on IMAP flow */
    ImapPort?: string;
    /** Only on IMAP flow */
    Sasl?: 'PLAIN' | 'XOAUTH2';
    /** Only on IMAP flow */
    AllowSelfSigned?: boolean;
    /** @deprecated replaced by account */
    Email: string;
}

/**
 * importer/v1/importers
 */
export interface ApiImportListResponse extends ApiResponse {
    Importers: ApiImporter[];
}

/**
 * importer/v1/importer
 */
export interface ApiImportResponse extends ApiResponse {
    Importer: ApiImporter;
}
