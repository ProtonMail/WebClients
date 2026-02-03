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

export type SortFieldDataType = {
    [SortField.name]: string;
    [SortField.nodeType]: NodeType;
    [SortField.mediaType]: string;
    [SortField.metadataModificationTime]: Date | undefined;
    [SortField.modificationTime]: Date | undefined;
    [SortField.size]: number;
    [SortField.creationTime]: Date | undefined;
    [SortField.expirationTime]: Date | undefined;
    [SortField.numberOfInitializedDownloads]: number;
    [SortField.trashedTime]: Date | undefined;
    [SortField.sharedOn]: Date | undefined;
    [SortField.sharedBy]: string;
    [SortField.uploadedBy]: string;
    [SortField.location]: string;
};

/**
 * Generic comparator function type
 * Returns negative if a < b, 0 if a === b, positive if a > b
 */
export type Comparator<T> = (a: T, b: T) => number;

export type SortComparator =
    | Comparator<string>
    | Comparator<number>
    | Comparator<Date | undefined>
    | Comparator<NodeType>;

export type SortConfig = {
    field: SortField;
    comparator: SortComparator;
    /** Optional direction for this level. If not specified, uses the global direction for the first level */
    direction?: SORT_DIRECTION;
}[];
