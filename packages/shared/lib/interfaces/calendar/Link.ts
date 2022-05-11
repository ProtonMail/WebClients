import { Nullable } from '../utils';
import { Calendar } from './Calendar';

export enum ACCESS_LEVEL {
    LIMITED = 0,
    FULL = 1,
}

export interface CalendarUrl {
    CalendarUrlID: string;
    CalendarID: string;
    PassphraseID?: string;
    AccessLevel: ACCESS_LEVEL;
    EncryptedPurpose: Nullable<string>;
    EncryptedCacheKey: string;
    EncryptedPassphrase: Nullable<string>;
    CreateTime: number;
}

export interface CalendarUrlResponse {
    CalendarUrl: CalendarUrl;
    Code: number;
}

export interface CalendarUrlsResponse {
    CalendarUrls: CalendarUrl[];
    Code: number;
}

export interface CalendarMap {
    [key: string]: Calendar;
}

export interface CalendarLink extends Omit<CalendarUrl, 'PassphraseID'> {
    purpose: Nullable<string>;
    link: string;
}

export interface CopyLinkParams {
    calendarID: string;
    urlID: string;
    accessLevel: ACCESS_LEVEL;
    encryptedPassphrase: Nullable<string>;
    encryptedCacheKey: string;
}
