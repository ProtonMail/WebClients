import {
    AuthenticationMethod,
    CalendarImporterPayload,
    ContactsImporterPayload,
    ImportType,
    MailImportDestinationFolder,
    MailImportGmailCategories,
    MailImporterPayload,
} from '@proton/activation/src/interface';
import { EVENT_ACTIONS } from '@proton/shared/lib/constants';
import { ApiResponse } from '@proton/shared/lib/interfaces';

/**
 * API EVENTS
 */
interface ApiEventType {
    ID: string;
    Action: EVENT_ACTIONS;
}

export interface ApiEvent {
    More?: 0 | 1;
    EventID?: string;
    Refresh?: number;
    Imports?: ApiImportEvent[];
    ImportReports?: ApiImportReportEvent[];
    ImporterSyncs?: ApiSyncEvent[];
}

export interface ApiImportReportEvent extends ApiEventType {
    ImportReport?: ApiReport;
}

export interface ApiImportEvent extends ApiEventType {
    Importer?: ApiImporter;
}

export interface ApiSyncEvent extends ApiEventType {
    ImporterSync?: ApiSync;
}

/**
 * API CALLS RESPONSES
 */

export interface ApiMailImporterFolder {
    Source: string;
    /** The hierarchy delimiter in the Source field */
    Separator: string;
    Size: number;
    /**
     * TODO
     * Flags seem to deliver inconsistent results between
     * IMAP and OAuth calls. We will not rely on it ATM
     * */
    Flags: string[];
    Total?: number;
    DestinationCategory?: MailImportGmailCategories;
    DestinationFolder?: MailImportDestinationFolder;
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
    NumMessages?: number;
    NumContacts?: number;
    NumGroups?: number;
    NumEvents?: number;
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

export enum ApiImporterError {
    ERROR_CODE_IMAP_CONNECTION = 1,
    ERROR_CODE_QUOTA_LIMIT = 2,
}

export interface ApiImporterFolder {
    SourceFolder: string;
    DestinationFolder?: MailImportDestinationFolder;
    Processed: number;
    Total: number;
    Source?: string;
}

export interface ApiImporterActive {
    CreateTime: number;
    State: ApiImporterState;
    ErrorCode?: ApiImporterError;
    Mapping?: ApiImporterFolder[];
    Processed?: number;
    Total?: number;
    AttemptTime?: number;
    NumContacts?: number;
    FilterStartDate?: string;
    FilterEndDate?: string;
}

export interface ApiImporter {
    ID: string;
    /** Only on IMAP flow */
    TokenID?: string;
    Account: string;
    Provider: ApiImportProvider;
    Product: ImportType[];
    Active?: Partial<Record<ImportType, ApiImporterActive>>;
    ModifyTime: number;
    /** Only on IMAP flow */
    ImapHost?: string;
    /** Only on IMAP flow */
    ImapPort?: string;
    /** Only on IMAP flow */
    Sasl?: AuthenticationMethod;
    /** Only on IMAP flow */
    AllowSelfSigned?: boolean;
    /** @deprecated replaced by account */
    Email: string;
}

/**
 * GET importer/v1/reports
 */
export interface ApiImportReportListResponse extends ApiResponse {
    Reports: ApiReport[];
}

/**
 * GET importer/v1/importers
 */
export interface ApiImportListResponse extends ApiResponse {
    Importers: ApiImporter[];
}

/**
 * GET importer/v1/importers/{enc_importerID}
 */
export interface ApiImportResponse extends ApiResponse {
    Importer: ApiImporter;
}

/**
 * POST importer/v1/mail/importers/authinfo
 */
export interface ApiImporterAuthInfoResponse extends ApiResponse {
    Authentication: {
        Sasl: string;
        OAuthUrl: string;
        OAuthParams: string[];
        ImapHost: string;
        ImapPort: number;
        ImporterID: string;
    };
}

/**
 * POST importer/v1/importers
 */
export interface ApiCreateImporterResponse extends ApiResponse {
    ImporterID: string;
}

/**
 * GET importer/v1/mail/importers/${importerID}
 */
export interface ApiImporterImportResponse extends ApiResponse {
    Folders: ApiMailImporterFolder[];
}

/**
 * POST importer/v1/importers/start
 */
export interface ApiStartImportParams {
    ImporterID: string;
    [ImportType.MAIL]?: MailImporterPayload;
    [ImportType.CALENDAR]?: CalendarImporterPayload;
    [ImportType.CONTACTS]?: ContactsImporterPayload;
}
export interface ApiStartImportResponse extends ApiResponse {}

/**
 * importer/v1/sync
 */

export enum ApiSyncState {
    OFFLINE = 0,
    ACTIVE = 1,
    EXPIRED = 2,
}
export interface ApiSync {
    Account: string;
    ID: string;
    ImporterID: string;
    Product: ImportType;
    State: ApiSyncState;
    CreateTime: number;
    LastImportTime: number;
    LastRenewTime: number;
}

export interface APIImportSyncListResponse extends ApiResponse {
    Syncs: ApiSync[];
}
