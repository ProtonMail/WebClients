import { useDriveDocsFeatureFlag } from '../store/_documents';
import { type DocumentKeys, useDocuments } from './_documents';
import { usePublicNode } from './_nodes';
import type { DecryptedNode } from './_nodes/interface';
import { usePublicDocsToken } from './_shares';
import type { PublicNodeMeta } from './interface';

export interface PublicDriveCompat {
    /**
     * Whether or not Docs is enabled. Only uses feature flags, not context aware.
     */
    isDocsEnabled: boolean;

    /**
     * Whether or not the interface is ready to receive calls.
     */
    isReady: boolean;

    /**
     * Whether or not there was an error loading the public link.
     */
    isError: boolean;

    /**
     * Gets a node, either from cache or fetched.
     */
    getNode: (meta: PublicNodeMeta) => Promise<DecryptedNode>;

    /**
     * Gets the keys for a given document node.
     */
    getDocumentKeys: (meta: PublicNodeMeta) => Promise<DocumentKeys>;
}

export const usePublicDriveCompat = (): PublicDriveCompat => {
    const { isDocsEnabled } = useDriveDocsFeatureFlag();

    const { isReady, isError } = usePublicDocsToken();

    const { getNode } = usePublicNode();
    const { getDocumentKeys } = useDocuments();

    return {
        isDocsEnabled,
        isReady,
        isError,
        getDocumentKeys: ({ token, linkId }) => getDocumentKeys({ shareId: token, linkId }),
        getNode,
    };
};
