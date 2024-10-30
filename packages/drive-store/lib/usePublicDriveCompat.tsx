import { useDriveDocsFeatureFlag, useDriveDocsPublicSharingFF, useOpenDocument } from '../store/_documents';
import { type DocumentKeys } from './_documents';
import { usePublicNode } from './_nodes';
import type { DecryptedNode } from './_nodes/interface';
import { usePublicDocsToken } from './_shares';
import type { NodeMeta, PublicNodeMeta } from './interface';

export interface PublicDriveCompat {
    /**
     * Whether or not Docs is enabled. Only uses feature flags, not context aware.
     */
    isDocsEnabled: boolean;

    /**
     * Whether or not the public docs feature flag is enabled.
     */
    isPublicDocsEnabled: boolean;

    /**
     * The custom password for the public link.
     */
    customPassword: string;

    /**
     * The token for the public link.
     */
    token: string;

    /**
     * The url password for the public link.
     */
    urlPassword: string;

    /**
     * Whether or not a custom password is needed.
     */
    isPasswordNeeded: boolean;

    /**
     * Submits the custom password.
     */
    submitPassword: (customPassword: string) => Promise<void>;

    /**
     * Whether or not the interface is ready to receive calls.
     */
    isReady: boolean;

    /**
     * Whether or not there was an error loading the public link.
     */
    isError: boolean;

    /**
     * The error that occurred while loading the public link.
     */
    error?: Error;

    /**
     * Gets a node, either from cache or fetched.
     */
    getNode: (meta: PublicNodeMeta) => Promise<DecryptedNode>;

    /**
     * Redirects to the authed document.
     */
    redirectToAuthedDocument: (meta: NodeMeta) => void;

    /**
     * Gets the keys for a given document node.
     */
    getDocumentKeys: (meta: PublicNodeMeta) => Promise<Pick<DocumentKeys, 'documentContentKey'>>;

    /**
     * Gets the authentication headers for `useApi()`
     */
    getPublicAuthHeaders: () => { [key: string]: string };
}

export const usePublicDriveCompat = (): PublicDriveCompat => {
    const { isDocsEnabled } = useDriveDocsFeatureFlag();
    const { isDocsPublicSharingEnabled } = useDriveDocsPublicSharingFF();

    const {
        isReady,
        isError,
        error,
        getPublicAuthHeaders,
        customPassword,
        token,
        urlPassword,
        isPasswordNeeded,
        submitPassword,
    } = usePublicDocsToken();

    const { isNodeLoading, getNode, getNodeContentKey } = usePublicNode();
    const { openDocumentWindow } = useOpenDocument();

    const redirectToAuthedDocument = (meta: NodeMeta) => openDocumentWindow({ ...meta, mode: 'open', window: window });

    return {
        isDocsEnabled,
        customPassword,
        isPasswordNeeded,
        submitPassword,
        token,
        urlPassword,
        isReady: isReady && !isNodeLoading,
        isError,
        error,
        redirectToAuthedDocument: redirectToAuthedDocument,
        isPublicDocsEnabled: isDocsPublicSharingEnabled,
        getDocumentKeys: async (nodeMeta) => ({
            documentContentKey: await getNodeContentKey(nodeMeta),
        }),
        getNode,
        getPublicAuthHeaders,
    };
};
