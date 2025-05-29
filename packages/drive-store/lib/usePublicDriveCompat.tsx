import { createContext, useCallback, useContext } from 'react';
import type { ReactNode } from 'react';

import type { ResumedSessionResult } from '@proton/shared/lib/authentication/persistedSessionHelper';
import type { SHARE_URL_PERMISSIONS } from '@proton/shared/lib/drive/permissions';
import { LinkType } from '@proton/shared/lib/interfaces/drive/link';

import { useGetPublicKeysForEmail, usePublicActions } from '../store';
import type { DocumentType } from '../store/_documents';
import { useDriveDocsFeatureFlag, useDriveDocsPublicSharingFF, useOpenDocument } from '../store/_documents';
import { useAbortSignal } from '../store/_views/utils';
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
     * Whether waiting to receive custom password from the drive window that opened the document.
     */
    isWaitingForPasswordFromDriveWindow: boolean;

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
    redirectToAuthedDocument: (meta: NodeMeta, type?: DocumentType) => void;

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

    renamePublicDocument: (nodeMeta: PublicNodeMeta, parentLinkId: string, newName: string) => Promise<void>;

    linkId: string | undefined;
}

export const usePublicDriveCompatValue = (session?: ResumedSessionResult): PublicDriveCompat => {
    const { isDocsEnabled } = useDriveDocsFeatureFlag();
    const { isDocsPublicSharingEnabled } = useDriveDocsPublicSharingFF();

    const {
        isReady: isDocsTokenReady,
        isError: isPublicDocsTokenError,
        error: publicDocsTokenError,
        getPublicAuthHeaders,
        customPassword,
        token,
        linkIdParam,
        urlPassword,
        isWaitingForPasswordFromDriveWindow,
        isPasswordNeeded,
        submitPassword,
    } = usePublicDocsToken(session);

    const {
        rootLinkId,
        sharedUrlInfo,
        getNode,
        getNodeContentKey,
        didCompleteInitialSetup,
        getAddressKeyInfo,
        permissions,
    } = usePublicNode({
        isDocsTokenReady,
        linkId: linkIdParam,
    });
    const abortSignal = useAbortSignal([]);
    const { renameLink } = usePublicActions();

    const renamePublicDocument: PublicDriveCompat['renamePublicDocument'] = useCallback(
        async (nodeMeta, parentLinkId, newName) => {
            await renameLink(abortSignal, { ...nodeMeta, parentLinkId, newName });
        },
        [abortSignal, renameLink]
    );

    const { openDocumentWindow } = useOpenDocument();

    const redirectToAuthedDocument = (meta: NodeMeta, type: DocumentType = 'doc') =>
        openDocumentWindow({ ...meta, type, mode: 'open', window: window });

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

    const hasValidLinkId = sharedUrlInfo && sharedUrlInfo.linkType === LinkType.FOLDER ? !!linkIdParam : !!rootLinkId;
    const isLinkIdError = !!sharedUrlInfo && !hasValidLinkId;
    const linkIdError = isLinkIdError ? new Error('No valid linkId present') : undefined;

    return {
        isDocsEnabled,
        customPassword,
        isWaitingForPasswordFromDriveWindow,
        isPasswordNeeded,
        submitPassword,
        token,
        urlPassword,
        isSharedUrlAFolder: sharedUrlInfo?.linkType === LinkType.FOLDER,
        isReady: isDocsTokenReady && didCompleteInitialSetup,
        isError: isPublicDocsTokenError || isLinkIdError,
        error: publicDocsTokenError || linkIdError,
        redirectToAuthedDocument: redirectToAuthedDocument,
        isPublicDocsEnabled: isDocsPublicSharingEnabled,
        getDocumentKeys,
        getNode,
        getPublicAuthHeaders,
        permissions,
        getPublicKeysForEmail,
        renamePublicDocument,
        /**
         * For directly shared public doc links, Drive might redirect to Docs without a linkId.
         * If the linkType of the shared url is a file then we can use the linkId of the loaded root link,
         * and if the shared url is a folder we need the linkId param to be passed. In case it isn't,
         * an error page will be shown because `isError` and `error` will be truthy.
         */
        linkId: sharedUrlInfo && sharedUrlInfo.linkType === LinkType.FILE ? rootLinkId : linkIdParam,
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

export const PublicCompatProvider = ({
    children,
    session,
}: {
    children: ReactNode;
    session?: ResumedSessionResult;
}) => {
    const value = usePublicDriveCompatValue(session);

    return <PublicCompatContext.Provider value={value}>{children}</PublicCompatContext.Provider>;
};
