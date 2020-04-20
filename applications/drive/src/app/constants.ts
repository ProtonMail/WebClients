export const FOLDER_PAGE_SIZE = 150;
export const FILE_CHUNK_SIZE = 4 * 1024 * 1024;

export enum ResourceURLType {
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
