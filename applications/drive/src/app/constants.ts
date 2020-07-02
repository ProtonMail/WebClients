import { isMobile } from 'proton-shared/lib/helpers/browser';
import { SORT_DIRECTION } from 'proton-shared/lib/constants';
import { SortKeys } from './interfaces/link';

export const MB = 1024 * 1024;
export const FOLDER_PAGE_SIZE = 150;
export const BATCH_REQUEST_SIZE = 150;
export const FILE_CHUNK_SIZE = 4 * MB;
export const MEMORY_DOWNLOAD_LIMIT = (isMobile() ? 100 : 1000) * MB;
export const MAX_THREADS_PER_DOWNLOAD = 3;
export const MAX_THREADS_PER_REQUEST = 5;
export const DEFAULT_SORT_FIELD = 'ModifyTime';
export const DEFAULT_SORT_ORDER = SORT_DIRECTION.ASC;
export const DEFAULT_SORT_PARAMS: { sortField: SortKeys; sortOrder: SORT_DIRECTION } = {
    sortField: DEFAULT_SORT_FIELD,
    sortOrder: DEFAULT_SORT_ORDER
};
export const UPLOAD_TIMEOUT = 60000;
export const DOWNLOAD_TIMEOUT = 60000;
export const EXPENSIVE_REQUEST_TIMEOUT = 60000;

export enum LinkURLType {
    FOLDER = 'folder',
    FILE = 'file'
}

export enum EVENT_TYPES {
    DELETE = 0,
    CREATE = 1,
    UPDATE = 2,
    UPDATE_METADATA = 3
}
