import { isMobile } from 'proton-shared/lib/helpers/browser';

export const MB = 1024 * 1024;
export const FOLDER_PAGE_SIZE = 150;
export const FILE_CHUNK_SIZE = 4 * MB;
export const MEMORY_DOWNLOAD_LIMIT = (isMobile() ? 100 : 1000) * MB;

export enum LinkURLType {
    FOLDER = 'folder',
    FILE = 'file'
}

export enum EVENT_TYPES {
    CREATE = 1,
    UPDATE = 2,
    UPDATE_CONTENT = 3,
    TRASH = 4,
    RESTORE = 5,
    MOVE = 6,
    DELETE = 7
}
