import type { PhotoTag } from '@proton/shared/lib/interfaces/drive/file';

export type PhotoGroup = string;

export interface PhotoAdditionalInfo {
    name: string;
    mediaType: string | undefined;
    duration: number | undefined;
    haveSignatureIssues: boolean | undefined;
    isShared: boolean;
    parentNodeUid: string | undefined;
    activeRevisionUid: string | undefined;
    /** @deprecated */
    deprecatedShareId: string | undefined;
}

export interface PhotoItem {
    nodeUid: string;
    captureTime: Date;
    tags: PhotoTag[];
    relatedPhotoNodeUids: string[];
    additionalInfo?: PhotoAdditionalInfo;
}

export type PhotoGridItem = PhotoItem | PhotoGroup;

/**
 * The slice of the photos store needed by modules that the store itself depends on.
 * Those modules take a getter for it instead of importing `usePhotos.store`, which
 * would close a dependency cycle back through the store.
 */
export type PhotosStoreState = {
    setPhotoItem: (photo: PhotoItem) => void;
    getPhotoItem: (uid: string) => PhotoItem | undefined;
    removePhotoItem: (uid: string) => void;
    addRelatedPhotoNodeUid: (mainPhotoNodeUid: string, relatedPhotoNodeUid: string) => void;
    setPhotoItemsWithoutTimeline: (photos: PhotoItem[]) => void;
};

export type GetPhotosStoreState = () => PhotosStoreState;
