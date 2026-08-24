import type { NodeType } from '@proton/drive';

export type SharedByMeItem = {
    nodeUid: string;
    name: string;
    type: NodeType;
    mediaType: string | undefined;
    activeRevisionUid: string | undefined;
    size: number | undefined;
    parentUid: string | undefined;
    location?: string;
    creationTime?: Date;
    haveSignatureIssues: boolean | undefined;
    // publicLink is optional as it will be dynamically loaded
    publicLink?: {
        expirationTime: Date | undefined;
        numberOfInitializedDownloads: number | undefined;
        url: string;
    };
};

/**
 * The slice of the shared-by-me store needed by modules that the store itself depends on.
 * Those modules take a getter for it instead of importing `useSharedByMe.store`, which
 * would close a dependency cycle back through the store.
 */
export type SharedByMeStoreState = {
    getSharedByMeItem: (uid: string) => SharedByMeItem | undefined;
    setSharedByMeItem: (item: SharedByMeItem) => void;
    removeSharedByMeItem: (uid: string) => void;
};

export type GetSharedByMeStoreState = () => SharedByMeStoreState;
