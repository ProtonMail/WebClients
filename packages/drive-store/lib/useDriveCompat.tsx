import { type ReactNode, useCallback } from 'react';

import { useGetAddressKeys } from '@proton/account/addressKeys/hooks';
import { useAuthentication } from '@proton/components';
import type { PublicKeyReference, SessionKey } from '@proton/crypto/lib';
import type { SHARE_MEMBER_PERMISSIONS } from '@proton/shared/lib/drive/permissions';
import { getNewWindow } from '@proton/shared/lib/helpers/window';
import type { DecryptedAddressKey } from '@proton/shared/lib/interfaces';

import { useMoveToFolderModal } from '../components/modals/MoveToFolderModal/MoveToFolderModal';
import { useLinkSharingModal } from '../components/modals/ShareLinkModal/ShareLinkModal';
import type { ShareURL } from '../store';
import { useDefaultShare, useShareUrl } from '../store';
import { useDriveCrypto } from '../store/_crypto';
import type { DocumentAction, DocumentType } from '../store/_documents';
import { useDriveDocsFeatureFlag, useOpenDocument } from '../store/_documents';
import { useLink } from '../store/_links';
import { getSharedLink } from '../store/_shares';
import type { PathItem } from '../store/_views/useLinkPath';
import { useAbortSignal } from '../store/_views/utils';
import type { CacheConfig } from './CacheConfig';
import type { NodeMeta } from './NodeMeta';
import type { DocumentNodeMeta } from './_documents';
import { useDocuments } from './_documents';
import type { DocumentKeys } from './_documents/DocumentKeys';
import type { DecryptedNode } from './_nodes/interface';
import useNode from './_nodes/useNode';
import useNodes from './_nodes/useNodes';
import { useMyFiles, useResolveShareId } from './_shares';

export interface DriveCompat {
    /**
     * Whether or not Docs is enabled. Only uses feature flags, not context aware.
     */
    isDocsEnabled: boolean;

    /**
     * Gets a node, either from cache or fetched.
     */
    getNode: (meta: NodeMeta) => Promise<DecryptedNode>;
    getLatestNode: (meta: NodeMeta) => Promise<DecryptedNode>;

    getNodes: (ids: { linkId: string; shareId: string }[]) => Promise<DecryptedNode[]>;

    getShareId: (meta: NodeMeta) => Promise<string>;

    getPublicShareUrlInfo: (signal: AbortSignal) => (id: NodeMeta) => Promise<
        | {
              shareUrl: ShareURL;
              keyInfo: {
                  shareSessionKey: SessionKey;
                  sharePasswordSalt: string;
              };
          }
        | undefined
    >;
    getSharedLinkFromShareUrl: (shareUrl: ShareURL | undefined) => string | undefined;

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
    createDocumentNode: (parentMeta: NodeMeta, name: string, documentType: DocumentType) => Promise<DocumentNodeMeta>;

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
    deleteDocumentPermanently: (meta: NodeMeta, parentLinkId: string) => Promise<void>;
    /**
     * Gets the URL for a given document.
     */
    getDocumentUrl: (meta: NodeMeta) => URL;

    getNodePaths: (ids: { linkId: string; shareId: string }[]) => Promise<PathItem[][]>;
    getNodesAreShared: (ids: { linkId: string; shareId: string }[]) => Promise<boolean[]>;
    /**
     * Opens a document's sharing modal.
     */
    openDocumentSharingModal: (props: {
        linkId: string;
        volumeId: string;
        onPublicLinkToggle?: (enabled: boolean) => void;
        registerOverriddenNameListener?: (listener: (name: string) => void) => void;
    }) => void;

    /**
     * Opens the "Move to folder" modal for the given link & volume id.
     */
    openMoveToFolderModal: (props: { linkId: string; volumeId: string }) => Promise<void>;

    /**
     * Opens a document in a new window.
     */
    openDocument: (meta: NodeMeta, type?: DocumentType) => void;
    openDocumentWindow: (
        action: DocumentAction & {
            window: Window;
        }
    ) => void;

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

    getKeysForLocalStorageEncryption: () => CacheConfig | undefined;

    getPrimaryAddressKeys: () => Promise<{ keys: DecryptedAddressKey[]; address: string } | undefined>;
}

export const useDriveCompat = (): DriveCompat => {
    const { withResolveShareId } = useResolveShareId();

    const authentication = useAuthentication();
    const getAddressKeys = useGetAddressKeys();

    const getKeysForLocalStorageEncryption: () => CacheConfig | undefined = useCallback(() => {
        const key = authentication.getClientKey();
        const localId = authentication.getLocalID();
        if (!key) {
            throw new Error('Invalid client key');
        }
        return { encryptionKey: key, namespace: localId };
    }, [authentication]);

    const {
        createDocumentNode,
        getDocumentKeys,
        renameDocument,
        getDocumentUrl,
        trashDocument,
        restoreDocument,
        deleteDocumentPermanently,
        confirmModal,
    } = useDocuments();
    const abortSignal = useAbortSignal([]);
    const { getLink } = useLink();
    const { getNode, getLatestNode, getNodeContents, getNodePermissions, findAvailableNodeName } = useNode();
    const { getNodes, getNodePaths, getNodesAreShared } = useNodes();
    const { getMyFilesNodeMeta } = useMyFiles();
    const { openDocumentWindow } = useOpenDocument();
    const { getVerificationKey } = useDriveCrypto();
    const { isDocsEnabled } = useDriveDocsFeatureFlag();

    const [moveToFolderModal, showMoveToFolderModal] = useMoveToFolderModal();
    const [linkSharingModal, showLinkSharingModal] = useLinkSharingModal();
    const { loadShareUrl } = useShareUrl();
    const { getDefaultShare, getDefaultShareAddressEmail } = useDefaultShare();

    const openDocument = (meta: NodeMeta, type: DocumentType = 'doc') =>
        openDocumentWindow({ ...meta, type, mode: 'open', window: getNewWindow().handle });

    const getPrimaryAddressKeys = async () => {
        const share = await getDefaultShare();

        const email = await getDefaultShareAddressEmail();
        const keys = await getAddressKeys(share.addressId);

        return { keys, address: email };
    };

    const openShareModal = async (props: {
        linkId: string;
        volumeId: string;
        onPublicLinkToggle?: (enabled: boolean) => void;
        registerOverriddenNameListener?: (listener: (name: string) => void) => void;
    }) => {
        const fnToWrap = ({ shareId, linkId }: { shareId: string; linkId: string }) =>
            showLinkSharingModal({
                shareId,
                linkId,
                onPublicLinkToggle: props.onPublicLinkToggle,
                registerOverriddenNameListener: props.registerOverriddenNameListener,
            });

        const wrappedFn = withResolveShareId(fnToWrap);

        void wrappedFn(props);
    };

    const openMoveToFolderModal = async (props: { linkId: string; volumeId: string }) => {
        const fnToWrap = async ({ shareId, linkId }: { shareId: string; linkId: string }) => {
            const link = await getLink(abortSignal, shareId, linkId);
            showMoveToFolderModal({
                shareId,
                selectedItems: [link],
            });
        };

        const wrappedFn = withResolveShareId(fnToWrap);

        void wrappedFn(props);
    };

    return {
        isDocsEnabled,
        createDocumentNode: withResolveShareId(createDocumentNode),
        getDocumentKeys: withResolveShareId(getDocumentKeys),
        getNodePaths,
        getNodesAreShared,
        getNode: withResolveShareId(getNode),
        getLatestNode: withResolveShareId(getLatestNode),
        getNodeContents: withResolveShareId(getNodeContents),
        getNodePermissions: withResolveShareId(getNodePermissions),
        getNodes,
        getShareId: withResolveShareId(({ shareId }) => shareId),
        getPublicShareUrlInfo: (signal: AbortSignal) =>
            withResolveShareId(({ shareId, linkId }) => loadShareUrl(signal, shareId, linkId)),
        getSharedLinkFromShareUrl: getSharedLink,
        findAvailableNodeName: withResolveShareId(findAvailableNodeName),
        renameDocument: withResolveShareId(renameDocument),
        trashDocument: withResolveShareId(trashDocument),
        restoreDocument: withResolveShareId(restoreDocument),
        deleteDocumentPermanently: withResolveShareId(deleteDocumentPermanently),
        getDocumentUrl,
        openDocument,
        openDocumentWindow,
        openDocumentSharingModal: openShareModal,
        openMoveToFolderModal,
        getMyFilesNodeMeta,
        getVerificationKey,
        // This should be changed to a fragment if more modals are added
        modals: (
            <>
                {moveToFolderModal}
                {linkSharingModal}
                {confirmModal}
            </>
        ),
        getKeysForLocalStorageEncryption,
        getPrimaryAddressKeys,
    };
};
