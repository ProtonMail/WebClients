import { Label } from '@proton/shared/lib/interfaces/Label';

import { ApiImporterError, ApiImporterState, ApiReportRollbackState } from './api/api.interface';

export enum ImportProvider {
    GOOGLE = 'google',
    YAHOO = 'yahoo',
    OUTLOOK = 'outlook',
    DEFAULT = 'default',
}

export enum OAUTH_PROVIDER {
    GOOGLE = 1,
    OUTLOOK = 2,
}

export interface OAuthProps {
    Code: string;
    Provider: OAUTH_PROVIDER;
    RedirectUri: string;
}

export enum ImportType {
    MAIL = 'Mail',
    CALENDAR = 'Calendar',
    CONTACTS = 'Contacts',
    // DRIVE = 'Drive',
}

export interface CreateImportPayload {
    TokenID?: string;
    Source?: string;
    [ImportType.MAIL]?: {
        Account: string;
        ImapHost?: string;
        ImapPort?: number;
        Sasl: AuthenticationMethod;
        Code?: string;
        AllowSelfSigned?: number;
        RedirectUri?: string; // for reconnection
    };
    [ImportType.CALENDAR]?: {};
    [ImportType.CONTACTS]?: {};
}

export interface LaunchImportPayload {
    ImporterID: string;
    [ImportType.MAIL]?: MailImporterPayload;
    [ImportType.CALENDAR]?: CalendarImporterPayload;
    [ImportType.CONTACTS]?: ContactsImporterPayload;
    // [ImportType.DRIVE]?: DriveImporterPayload;
}

/* Token */

export interface ImportToken {
    ID: string;
    Account: string;
    Provider: OAUTH_PROVIDER;
    Products: ImportType[];
}

/* Mail Specific */

export enum AuthenticationMethod {
    PLAIN = 'PLAIN',
    OAUTH = 'XOAUTH2',
}

export interface MailImportMapping {
    Source: string;
    Destinations: {
        FolderPath?: string;
        Labels?: Pick<Label, 'Name' | 'Color'>[];
        Category?: string;
    };
    checked?: boolean;
}

export interface MailImporterPayload {
    AddressID: string;
    /** User app password */
    Code?: string;
    /** Label used on  */
    ImportLabel?: Pick<Label, 'Name' | 'Color' | 'Type'>;
    /** Unix timestamp. Received emails import starts after this date. */
    StartTime?: Date | number;
    /** Unix timestamp. Received emails import stops after this date. */
    EndTime?: number;
    Mapping: MailImportMapping[];
    /** Bitmap of custom settings */
    CustomFields?: number;
}

export enum MailImportDestinationFolder {
    INBOX = 'Inbox',
    ALL_DRAFTS = 'All Drafts',
    ALL_SENT = 'All Sent',
    TRASH = 'Trash',
    SPAM = 'Spam',
    ALL_MAIL = 'All Mail',
    ALMOST_ALL_MAIL = 'Almost All Mail',
    STARRED = 'Starred',
    ARCHIVE = 'Archive',
    SENT = 'Sent',
    DRAFTS = 'Drafts',
}

export enum TIME_PERIOD {
    BIG_BANG = 'big_bang',
    LAST_YEAR = 'last_year',
    LAST_3_MONTHS = 'last_3_months',
    LAST_MONTH = 'last_month',
}

export enum IMPORT_ERROR {
    UNEXPECTED_ERROR = 2000,
    IMAP_CONNECTION_ERROR = 2900,
    AUTHENTICATION_ERROR = 2901,
    ALREADY_EXISTS = 2500,
    OAUTH_INSUFFICIENT_SCOPES = 2027,
    BANDWIDTH_LIMIT = 2902,
    TEMP_PROVIDER_ERROR = 2902,
    RATE_LIMIT_EXCEEDED = 429,
    ACCOUNT_DOES_NOT_EXIST = 2011,
}

//TODO complete this once backend is more stable
export enum SYNC_ERROR {
    MISSING_PRODUCT = 2000,
    WRONG_PRODUCT = 2001,
    AUTH_ERROR = 2501,
}

interface ImportedFolder {
    SourceFolder: string;
    DestinationFolder?: MailImportDestinationFolder;
    Processed: number;
    Total: number;
}

export enum MailImportGmailCategories {
    FORUMS = 'Forums',
    PROMOTIONS = 'Promotions',
    SOCIAL = 'Social',
    UPDATES = 'Updates',
}

export enum MailImportPayloadError {
    MAX_FOLDERS_LIMIT_REACHED = 'Max folders limit reached',
    FOLDER_NAMES_TOO_LONG = 'Folder names too long', //OK
    LABEL_NAMES_TOO_LONG = 'Label names too long', //ok
    UNAVAILABLE_NAMES = 'Unavailable names', //ok
    RESERVED_NAMES = 'Reserved names', //ok
    EMPTY = 'EMPTY', //ok
    MERGE_WARNING = 'MERGE_WARNING',
}

export enum CustomFieldsBitmap {
    Mapping = 1,
    Label = 2,
    Period = 4,
}

/* Calendar Specific */

export interface CalendarImportMapping {
    Source: string;
    Destination: string;
    Description: string;
}

export enum IsCustomCalendarMapping {
    TRUE = 1,
    FALSE = 0,
}

export interface CalendarImporterPayload {
    Mapping: CalendarImportMapping[];
    CustomCalendarMapping: IsCustomCalendarMapping;
}

export interface ImportedCalendar {
    ID: string;
    Source: string;
    Description: string;
}

/* Contacts Specific */

export interface ContactsImporterPayload {}

/* Drive Specific */

export interface DriveImporterPayload {}

/* Imports and Reports from Server */

interface ImporterActiveProps {
    CreateTime: number;
    State: ApiImporterState;
    ErrorCode?: ApiImporterError;
    Mapping: ImportedFolder[];
    Processed?: number;
    Total?: number;
}

export interface Importer {
    ID: string;
    TokenID: string;
    Account: string;
    Provider: number;
    Product: ImportType[];
    Active?: {
        [ImportType.MAIL]?: ImporterActiveProps;
        [ImportType.CALENDAR]?: ImporterActiveProps;
        [ImportType.CONTACTS]?: ImporterActiveProps;
    };
    ImapHost: string;
    ImapPort: string;
    Sasl: AuthenticationMethod;
    AllowSelfSigned: boolean;
    Email: string; // Soon to be deprecated
}

enum ImportReportStatus {
    UNSENT = 0,
    SENT = 1,
}

interface ImportSummary {
    State: ApiImporterState;
    TotalSize: number;
    RollbackState?: ApiReportRollbackState;
}

export interface ImportReportAggregated {
    ID: string;
    Account: string;
    Provider: number;
    State: ImportReportStatus;
    TokenID: string;
    CreateTime: number;
    EndTime: number;
    Summary: {
        Mail?: ImportSummary & {
            NumMessages: number;
        };
        Calendar?: ImportSummary & {
            NumEvents: number;
        };
        Contacts?: ImportSummary & {
            NumContacts: number;
        };
    };
}

export interface ImportReport {
    ID: string;
    Account: string;
    Provider: number;
    TokenID: string;
    CreateTime: number;
    EndTime: number;
    NumItems: number;
    State: ApiImporterState;
    TotalSize: number;
    Product: ImportType;
    RollbackState?: ApiReportRollbackState;
}

export enum EASY_SWITCH_SOURCE {
    EASY_SWITCH_SETTINGS = 'easy-switch-settings',
    IMPORT_CONTACT_SETTINGS = 'import-contacts-settings',
    CONTACTS_WIDGET_SETTINGS = 'contacts-widget-settings',
    IMPORT_CALENDAR_SETTINGS = 'import-calendar-settings',
    RECONNECT_IMPORT = 'reconnect-import',
    IMPORT_CONTACTS_BUTTON = 'import-contacts-button', // fallback for Import Contacts button
}

export interface EasySwitchFeatureFlag {
    GoogleMail: boolean;
    GoogleMailSync: boolean;
    GoogleCalendar: boolean;
    GoogleContacts: boolean;
    GoogleDrive: boolean;
    OutlookMail: boolean;
    OutlookCalendar: boolean;
    OutlookContacts: boolean;
    OtherMail: boolean;
    OtherCalendar: boolean;
    OtherContacts: boolean;
    OtherDrive: boolean;
}
