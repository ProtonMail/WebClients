import type { Label } from '@proton/shared/lib/interfaces/Label';

import type { ApiImporterError, ApiImporterState, ApiReportRollbackState } from './api/api.interface';

export enum ImportProvider {
    GOOGLE = 'google',
    YAHOO = 'yahoo',
    OUTLOOK = 'outlook',
    DEFAULT = 'default',
}

export enum OAUTH_PROVIDER {
    GOOGLE = 1,
    OUTLOOK = 2,
    ZOOM = 3,
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
    TOO_LARGE = 2024,
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
    NewCalendar?: number;
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

export enum EASY_SWITCH_SOURCES {
    ACCOUNT_WEB_SETTINGS = 'account-web-settings',
    CALENDAR_WEB_SETTINGS = 'calendar-web-settings',
    CONTACTS_WEB_SETTINGS = 'contacts-web-settings',
    ACCOUNT_WEB_RECONNECT_IMPORT = 'account-web-reconnect-import',
    ACCOUNT_WEB_RECONNECT_SYNC = 'account-web-reconnect-sync',
    WEB_ONBOARDING = 'web-onboarding',
    MAIL_WEB_SIDEBAR = 'mail-web-sidebar',
    CONTACT_WEB_IMPORT_BUTTON = 'contacts-web-import-button',
    MAIL_WEB_CHECKLIST = 'mail-web-checklist',
    MAIL_WEB_ONBOARDING = 'mail-web-onboarding',
    CALENDAR_WEB_CREATE_EVENT = 'calendar-web-create-event',
    // Used as fallback when source could be undefined, will allow ot indicate missing source in log tool
    UNKNOWN = 'unknown',
}

export enum EASY_SWITCH_SEARCH_SOURCES {
    CONTACT_IMPORT = 'contact-import',
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
