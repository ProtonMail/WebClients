import type { ReactNode } from 'react';
import { createContext, useContext } from 'react';

import { SHARE_URL_PERMISSIONS } from '@proton/shared/lib/drive/permissions';

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
    getNode: (meta: PublicNodeMeta, forceFetch?: boolean) => Promise<DecryptedNode>;

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

    /**
     * The decrypted node.
     */
    decryptedNode: DecryptedNode | undefined;

    /**
     * The permissions of the public link.
     */
    permissions: SHARE_URL_PERMISSIONS | undefined;
}

export const usePublicDriveCompatValue = (): PublicDriveCompat => {
    const { isDocsEnabled } = useDriveDocsFeatureFlag();
    const { isDocsPublicSharingEnabled } = useDriveDocsPublicSharingFF();

    const {
        isReady: isDocsTokenReady,
        isError,
        error,
        getPublicAuthHeaders,
        customPassword,
        token,
        urlPassword,
        isPasswordNeeded,
        submitPassword,
        linkId,
    } = usePublicDocsToken();

    const { getNode, getNodeContentKey, didCompleteInitialSetup, decryptedNode, permissions } = usePublicNode({
        isDocsTokenReady,
        linkId,
    });
    const { openDocumentWindow } = useOpenDocument();

    const redirectToAuthedDocument = (meta: NodeMeta) => openDocumentWindow({ ...meta, mode: 'open', window: window });

    return {
        isDocsEnabled,
        customPassword,
        isPasswordNeeded,
        submitPassword,
        token,
        urlPassword,
        isReady: isDocsTokenReady && didCompleteInitialSetup,
        isError,
        error,
        redirectToAuthedDocument: redirectToAuthedDocument,
        isPublicDocsEnabled: isDocsPublicSharingEnabled,
        getDocumentKeys: async (nodeMeta) => ({
            documentContentKey: await getNodeContentKey(nodeMeta),
        }),
        getNode,
        getPublicAuthHeaders,
        decryptedNode,
        permissions,
    };
};

export const PublicCompatContext = createContext<PublicDriveCompat | null>(null);

export const usePublicDriveCompat = () => {
    const context = useContext(PublicCompatContext);
    if (!context) {
        throw new Error('No provider for PublicCompatContext');
    }
    return context;
};

export const PublicCompatProvider = ({ children }: { children: ReactNode }) => {
    const value = usePublicDriveCompatValue();

    return <PublicCompatContext.Provider value={value}>{children}</PublicCompatContext.Provider>;
};
