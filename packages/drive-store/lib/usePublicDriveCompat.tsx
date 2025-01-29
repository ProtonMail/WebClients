import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';

import type { SHARE_URL_PERMISSIONS } from '@proton/shared/lib/drive/permissions';
import { LinkType } from '@proton/shared/lib/interfaces/drive/link';

import { useGetPublicKeysForEmail } from '../store';
import { useDriveDocsFeatureFlag, useDriveDocsPublicSharingFF, useOpenDocument } from '../store/_documents';
import type { NodeMeta, PublicNodeMeta } from './NodeMeta';
import type { PublicDocumentKeys } from './_documents';
import { usePublicNode } from './_nodes';
import type { DecryptedNode } from './_nodes/interface';
import { usePublicDocsToken } from './_shares';

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
     * Returns true when the shared url is a folder rather than the current document only.
     */
    isSharedUrlAFolder: boolean | undefined;

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
    getDocumentKeys: (meta: PublicNodeMeta) => Promise<PublicDocumentKeys>;

    /**
     * Gets the authentication headers for `useApi()`
     */
    getPublicAuthHeaders: () => { [key: string]: string };

    /**
     * The permissions of the public link.
     */
    permissions: SHARE_URL_PERMISSIONS | undefined;

    /**
     * Gets the public keys for a given email.
     */
    getPublicKeysForEmail: (email: string, abortSignal?: AbortSignal) => Promise<string[] | undefined>;
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

    const { sharedUrlInfo, getNode, getNodeContentKey, didCompleteInitialSetup, getAddressKeyInfo, permissions } =
        usePublicNode({
            isDocsTokenReady,
            linkId,
        });
    const { openDocumentWindow } = useOpenDocument();

    const redirectToAuthedDocument = (meta: NodeMeta) => openDocumentWindow({ ...meta, mode: 'open', window: window });

    const { getPublicKeysForEmail } = useGetPublicKeysForEmail();

    const getDocumentKeys = async (meta: PublicNodeMeta): Promise<PublicDocumentKeys> => {
        const documentContentKey = await getNodeContentKey(meta);
        const addressInfoResult = await getAddressKeyInfo(new AbortController().signal);

        return {
            documentContentKey,
            userAddressPrivateKey: addressInfoResult?.privateKey,
            userOwnAddress: addressInfoResult?.address.Email,
        };
    };

    return {
        isDocsEnabled,
        customPassword,
        isPasswordNeeded,
        submitPassword,
        token,
        urlPassword,
        isSharedUrlAFolder: sharedUrlInfo?.linkType === LinkType.FOLDER,
        isReady: isDocsTokenReady && didCompleteInitialSetup,
        isError,
        error,
        redirectToAuthedDocument: redirectToAuthedDocument,
        isPublicDocsEnabled: isDocsPublicSharingEnabled,
        getDocumentKeys,
        getNode,
        getPublicAuthHeaders,
        permissions,
        getPublicKeysForEmail,
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
