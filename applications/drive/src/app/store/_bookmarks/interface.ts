import type { SharedURLInfo } from '@proton/shared/lib/interfaces/drive/sharing';

export interface Bookmark {
    encryptedUrlPasword: string;
    createTime: number;
    token: SharedURLInfo;
}
