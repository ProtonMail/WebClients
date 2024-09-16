import type { ReactNode } from 'react';

import type { PublicKeyReference } from '@proton/crypto/lib';
import type { SHARE_MEMBER_PERMISSIONS } from '@proton/shared/lib/drive/constants';
import { getNewWindow } from '@proton/shared/lib/helpers/window';

import { useLinkSharingModal } from '../components/modals/ShareLinkModal/ShareLinkModal';
import { useDriveCrypto } from '../store/_crypto';
import { useDriveDocsFeatureFlag, useOpenDocument } from '../store/_documents';
import type { DocumentKeys, DocumentNodeMeta } from './_documents';
import { useDocuments } from './_documents';
import type { DecryptedNode } from './_nodes/interface';
import useNode from './_nodes/useNode';
import { useMyFiles, useResolveShareId } from './_shares';
import type { NodeMeta } from './interface';

export interface DriveCompat {
    /**
     * Whether or not Docs is enabled. Only uses feature flags, not context aware.
     */
    isDocsEnabled: boolean;

    /**
     * Gets whether or not Docs can be used, with awareness of the context.
     */
    canUseDocs: (meta: NodeMeta) => Promise<boolean>;

    /**
     * Gets a node, either from cache or fetched.
     */
    getNode: (meta: NodeMeta) => Promise<DecryptedNode>;

    /**
     * Gets the contents of a node.
     */
    getNodeContents: (meta: NodeMeta) => Promise<{ contents: Uint8Array; node: DecryptedNode }>;

    /**
     * Gets permissions associated to a specific node.
     */
    getNodePermissions: (meta: NodeMeta) => Promise<SHARE_MEMBER_PERMISSIONS>;

    /**
     * Finds an available name for a new node.
     *
     * @param parentMeta The parent node where the new node will be located.
     */
    findAvailableNodeName: (parentMeta: NodeMeta, desiredName: string) => Promise<string>;

    /**
     * Creates an empty document node (document shell).
     *
     * @param parentMeta The parent node where the new node will be located.
     */
    createDocumentNode: (parentMeta: NodeMeta, name: string) => Promise<DocumentNodeMeta>;

    /**
     * Gets the keys for a given document node.
     */
    getDocumentKeys: (meta: NodeMeta) => Promise<DocumentKeys>;

    /**
     * Renames a document node.
     */
    renameDocument: (meta: NodeMeta, newName: string) => Promise<void>;

    trashDocument: (meta: NodeMeta, parentLinkId: string) => Promise<void>;
    restoreDocument: (meta: NodeMeta, parentLinkId: string) => Promise<void>;
    /**
     * Gets the URL for a given document.
     */
    getDocumentUrl: (meta: NodeMeta) => URL;

    /**
     * Opens a document's sharing modal.
     */
    openDocumentSharingModal: (meta: NodeMeta) => void;

    /**
     * Opens a document in a new window.
     */
    openDocument: (meta: NodeMeta) => void;

    /**
     * Gets the key used to verify signatures.
     */
    getVerificationKey: (email: string) => Promise<PublicKeyReference[]>;

    /**
     * Gets the node identifier for My Files.
     *
     * Temporary utility function, subject to change :)
     */
    getMyFilesNodeMeta: () => Promise<NodeMeta>;

    /**
     * Modals that should be included in the DOM tree.
     */
    modals: ReactNode;
}

export const useDriveCompat = (): DriveCompat => {
    const { withResolve } = useResolveShareId();

    const { createDocumentNode, getDocumentKeys, renameDocument, getDocumentUrl, trashDocument, restoreDocument } =
        useDocuments();
    const { getNode, getNodeContents, getNodePermissions, findAvailableNodeName } = useNode();
    const { getMyFilesNodeMeta } = useMyFiles();
    const { openDocumentWindow } = useOpenDocument();
    const { getVerificationKey } = useDriveCrypto();
    const { isDocsEnabled, canUseDocs } = useDriveDocsFeatureFlag();

    const [linkSharingModal, showLinkSharingModal] = useLinkSharingModal();

    const openDocument = (meta: NodeMeta) =>
        openDocumentWindow({ ...meta, mode: 'open', window: getNewWindow().handle });

    return {
        isDocsEnabled,
        canUseDocs: withResolve(({ shareId }) => canUseDocs(shareId)),
        createDocumentNode: withResolve(createDocumentNode),
        getDocumentKeys: withResolve(getDocumentKeys),
        getNode: withResolve(getNode),
        getNodeContents: withResolve(getNodeContents),
        getNodePermissions: withResolve(getNodePermissions),
        findAvailableNodeName: withResolve(findAvailableNodeName),
        renameDocument: withResolve(renameDocument),
        trashDocument: withResolve(trashDocument),
        restoreDocument: withResolve(restoreDocument),
        getDocumentUrl,
        openDocument,
        openDocumentSharingModal: withResolve(showLinkSharingModal),
        getMyFilesNodeMeta,
        getVerificationKey,
        // This should be changed to a fragment if more modals are added
        modals: linkSharingModal,
    };
};
