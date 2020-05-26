import { isMobile } from 'proton-shared/lib/helpers/browser';
import { SORT_DIRECTION } from 'proton-shared/lib/constants';

export const MB = 1024 * 1024;
export const FOLDER_PAGE_SIZE = 150;
export const FILE_CHUNK_SIZE = 4 * MB;
export const MEMORY_DOWNLOAD_LIMIT = (isMobile() ? 100 : 1000) * MB;
export const MAX_THREADS_PER_DOWNLOAD = 3;
export const DEFAULT_SORT_FIELD = 'Modified';
export const DEFAULT_SORT_ORDER = SORT_DIRECTION.ASC;

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
