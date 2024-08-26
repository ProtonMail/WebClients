import type { SharedURLInfo } from './sharing';

export interface BookmarkPayload {
    EncryptedUrlPassword: string;
    CreateTime: number;
    Token: SharedURLInfo;
}

export interface CreateBookmarkPayload {
    EncryptedUrlPassword: string;
    AddressID: string;
    AddressKeyID: string;
}
