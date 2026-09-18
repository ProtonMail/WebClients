import type { NodeType } from '@proton/drive';
import type { SORT_DIRECTION } from '@proton/shared/lib/constants';

export enum SortField {
    name = 'name',
    nodeType = 'nodeType',
    mediaType = 'mediaType',
    metadataModificationTime = 'metadataModificationTime',
    modificationTime = 'modificationTime',
    size = 'size',
    creationTime = 'creationTime',
    expirationTime = 'expirationTime',
    numberOfInitializedDownloads = 'numberOfInitializedDownloads',
    trashedTime = 'trashedTime',
    sharedOn = 'sharedOn',
    sharedBy = 'sharedBy',
    uploadedBy = 'uploadedBy',
    location = 'location',
}

/**
 * Generic comparator function type
 * Returns negative if a < b, 0 if a === b, positive if a > b
 */
export type Comparator<T> = (a: T, b: T) => number;

type SortComparator = Comparator<string> | Comparator<number> | Comparator<Date | undefined> | Comparator<NodeType>;

export type SortConfig = {
    field: SortField;
    comparator: SortComparator;
    /** Optional direction for this level. If not specified, uses the global direction for the first level */
    direction?: SORT_DIRECTION;
}[];
