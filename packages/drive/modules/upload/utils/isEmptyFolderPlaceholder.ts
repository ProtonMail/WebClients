import { EMPTY_FOLDER_PLACEHOLDER_FILE, EMPTY_FOLDER_PLACEHOLDER_MIMETYPE } from '../constants';

/**
 * The `.proton-drive-keep` placeholder is intentionally 0 bytes and is used to
 * preserve empty folders during upload. It must be exempt from the empty-file
 * check that blocks genuine 0-byte files.
 */
export const isEmptyFolderPlaceholder = (file: File): boolean =>
    file.name === EMPTY_FOLDER_PLACEHOLDER_FILE && file.type === EMPTY_FOLDER_PLACEHOLDER_MIMETYPE;
