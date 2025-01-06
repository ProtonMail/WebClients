import type { SharedURLInfoPayload } from './sharing';

export interface BookmarkPayload {
    EncryptedUrlPassword: string;
    CreateTime: number;
    Token: SharedURLInfoPayload;
}

export interface CreateBookmarkPayload {
    EncryptedUrlPassword: string;
    AddressID: string;
    AddressKeyID: string;
}
