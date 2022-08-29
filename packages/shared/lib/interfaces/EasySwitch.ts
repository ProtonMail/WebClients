import { Label } from './Label';

export enum OAUTH_PROVIDER {
    GOOGLE = 1,
}

export enum NON_OAUTH_PROVIDER {
    YAHOO = 'yahoo',
    OUTLOOK = 'outlook',
    DEFAULT = 'default',
}

export interface OAuthProps {
    Code: string;
    Provider: OAUTH_PROVIDER;
    RedirectUri: string;
}

export enum IAOauthModalModelStep {
    AUTHENTICATION = 0,
    SELECT_IMPORT_TYPE = 1,
    SUCCESS = 2,
    OAUTH_INSTRUCTIONS = 3,
}

export enum ImportType {
    MAIL = 'Mail',
    CALENDAR = 'Calendar',
    CONTACTS = 'Contacts',
    // DRIVE = 'Drive',
}

export interface IAOauthModalModelImportData {
    importerID: string;
    [ImportType.MAIL]: {
        selectedPeriod: TIME_PERIOD;
        providerFolders: ImportedMailFolder[];
    };
    [ImportType.CALENDAR]: {
        providerCalendars: ImportedCalendar[];
    };
    [ImportType.CONTACTS]: {
        numContacts: number;
        numContactGroups: number;
    };
    // [ImportType.DRIVE]: {
    // };
}

export interface IAOauthModalModel {
    step: IAOauthModalModelStep;
    oauthProps?: OAuthProps;
    tokenScope?: ImportType[];
    AddressID: string;
    importedEmail: string;
    payload: LaunchImportPayload;
    data: IAOauthModalModelImportData;
    isPayloadInvalid: boolean;
    isImportError?: boolean;
}

export type ImportPayloadType =
    | MailImporterPayload
    | CalendarImporterPayload
    | ContactsImporterPayload
    | DriveImporterPayload;

export type CheckedProductMap = {
    [K in ImportType.MAIL | ImportType.CALENDAR | ImportType.CONTACTS /* | ImportType.DRIVE */]: boolean;
};

export interface CreateImportPayload {
    TokenID?: string;
    Source?: string;
    [ImportType.MAIL]?: {
        Account: string;
        ImapHost: string;
        ImapPort: number;
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
    Code?: string;
    ImportLabel?: Pick<Label, 'Name' | 'Color' | 'Type'>;
    StartTime?: Date | number;
    Mapping: MailImportMapping[];
    CustomFields?: number;
}

export enum MailImportDestinationFolder {
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

export enum TIME_PERIOD {
    BIG_BANG = 'big_bang',
    LAST_YEAR = 'last_year',
    LAST_3_MONTHS = 'last_3_months',
    LAST_MONTH = 'last_month',
}

export enum IMPORT_ERROR {
    IMAP_CONNECTION_ERROR = 2900,
    AUTHENTICATION_ERROR = 2901,
    ALREADY_EXISTS = 2500,
    OAUTH_INSUFFICIENT_SCOPES = 2027,
    BANDWIDTH_LIMIT = 2902,
    TEMP_PROVIDER_ERROR = 2902,
    RATE_LIMIT_EXCEEDED = 429,
}

export interface ImportedFolder {
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

export interface ImportedMailFolder {
    DestinationCategory?: MailImportGmailCategories;
    DestinationFolder?: MailImportDestinationFolder;
    Flags: string[];
    Separator: string;
    Size: number;
    Source: string;
    Total: number;
}

export enum MailImportPayloadError {
    MAX_FOLDERS_LIMIT_REACHED = 'Max folders limit reached',
    FOLDER_NAMES_TOO_LONG = 'Folder names too long',
    LABEL_NAMES_TOO_LONG = 'Label names too long',
    UNAVAILABLE_NAMES = 'Unavailable names',
    RESERVED_NAMES = 'Reserved names',
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

export enum CalendarImportPayloadError {
    MAX_CALENDARS_LIMIT_REACHED = 'Max calendars limit reached',
}

/* Contacts Specific */

export interface ContactsImporterPayload {}

/* Drive Specific */

export interface DriveImporterPayload {}

/* Imports and Reports from Server */

export enum ImportError {
    ERROR_CODE_IMAP_CONNECTION = 1,
    ERROR_CODE_QUOTA_LIMIT = 2,
}

export enum ImportStatus {
    QUEUED = 0,
    RUNNING = 1,
    DONE = 2,
    FAILED = 3,
    PAUSED = 4,
    CANCELED = 5,
    DELAYED = 6,
}

export interface ImporterActiveProps {
    CreateTime: number;
    State: ImportStatus;
    ErrorCode?: ImportError;
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

export interface NormalizedImporter extends Pick<Importer, Exclude<keyof Importer, 'Active' | 'Product'>> {
    Active: ImporterActiveProps;
    Product: ImportType;
    tokenScope?: ImportType[];
}

enum ImportReportStatus {
    UNSENT = 0,
    SENT = 1,
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
        Mail?: {
            NumMessages: number;
            State: ImportStatus;
            TotalSize: number;
        };
        Calendar?: {
            NumEvents: number;
            State: ImportStatus;
            TotalSize: number;
        };
        Contacts?: {
            NumContacts: number;
            State: ImportStatus;
            TotalSize: number;
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
    State: ImportStatus;
    TotalSize: number;
    Product: ImportType;
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
    GoogleCalendar: boolean;
    GoogleContacts: boolean;
    GoogleDrive: boolean;
    OtherMail: boolean;
    OtherCalendar: boolean;
    OtherContacts: boolean;
    OtherDrive: boolean;
}
