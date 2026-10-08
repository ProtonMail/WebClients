import { type ReactNode, useCallback } from 'react';

import type { PublicKeyReference, SessionKey } from '@protontech/crypto';

import { useGetAddressKeys } from '@proton/account/addressKeys/hooks';
import { useAuthentication } from '@proton/components';
import type { SHARE_MEMBER_PERMISSIONS } from '@proton/shared/lib/drive/permissions';
import type { DecryptedAddressKey } from '@proton/shared/lib/interfaces';

import { useMoveToFolderModal } from '../components/modals/MoveToFolderModal/MoveToFolderModal';
import useDriveCrypto from '../store/_crypto/useDriveCrypto';
import type { DocumentType } from '../store/_documents/useOpenDocument';
import useLink from '../store/_links/useLink';
import useShare from '../store/_shares/useShare';
import type { PathItem } from '../store/_views/useLinkPath';
import { useAbortSignal } from '../store/_views/utils';
import type { CacheConfig } from './CacheConfig';
import type { LegacyNodeMeta, NodeMeta } from './NodeMeta';
import type { DocumentNodeMeta } from './_documents';
import { useDocuments } from './_documents';
import type { DecryptedNode } from './_nodes/interface';
import useNode from './_nodes/useNode';
import useNodes from './_nodes/useNodes';
import { useMyFiles, useResolveShareId } from './_shares';

export interface DriveCompat {
    /**
     * Gets a node, either from cache or fetched.
     */
    getNode: (meta: NodeMeta) => Promise<DecryptedNode>;
    getLatestNode: (meta: NodeMeta) => Promise<DecryptedNode>;

    getNodes: (ids: { linkId: string; shareId: string }[]) => Promise<DecryptedNode[]>;

    getShareId: (meta: NodeMeta) => Promise<string>;

    /**
     * Gets the contents of a node.
     */
    getNodeContents: (meta: NodeMeta) => Promise<{ contents: Uint8Array<ArrayBuffer>; node: DecryptedNode }>;

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
     * Gets the content key for a given document node.
     */
    getDocumentKeys: (meta: NodeMeta) => Promise<SessionKey>;

    /**
     * Renames a document node.
     */
    renameDocument: (meta: NodeMeta, newName: string) => Promise<void>;

    trashDocument: (meta: NodeMeta, parentLinkId: string) => Promise<void>;
    restoreDocument: (meta: NodeMeta, parentLinkId: string) => Promise<void>;
    deleteDocumentPermanently: (meta: NodeMeta, parentLinkId: string) => Promise<void>;

    getNodePaths: (ids: { linkId: string; shareId: string }[]) => Promise<PathItem[][]>;
    getNodesAreShared: (ids: { linkId: string; shareId: string }[]) => Promise<boolean[]>;

    /**
     * Opens the "Move to folder" modal for the given link & volume id.
     */
    openMoveToFolderModal: (props: { linkId: string; volumeId: string }) => Promise<void>;

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

    getMemberAddressKeys: (meta: NodeMeta) => Promise<{ keys: DecryptedAddressKey[]; address: string } | undefined>;
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
    const { getVerificationKey } = useDriveCrypto();

    const [moveToFolderModal, showMoveToFolderModal] = useMoveToFolderModal();
    const { getShareCreatorKeys } = useShare();

    // Uses the user's member address of the context share, which differs from default share for shared-with-me nodes
    const getMemberAddressKeys = async ({ shareId }: LegacyNodeMeta) => {
        const { address } = await getShareCreatorKeys(abortSignal, shareId);
        const keys = await getAddressKeys(address.ID);

        return { keys, address: address.Email };
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
        // No feature parity in Drive SDK - has to be done in Realtime SDK
        createDocumentNode: withResolveShareId(createDocumentNode),

        // SDK counterpart used when feature flag ON
        getNode: withResolveShareId(getNode),
        getLatestNode: withResolveShareId(getLatestNode),
        getNodeContents: withResolveShareId(getNodeContents),
        getShareId: withResolveShareId(({ shareId }) => shareId),
        getMyFilesNodeMeta,
        findAvailableNodeName: withResolveShareId(findAvailableNodeName),
        getDocumentKeys: withResolveShareId(getDocumentKeys),
        getMemberAddressKeys: withResolveShareId(getMemberAddressKeys),
        getKeysForLocalStorageEncryption,
        getVerificationKey,
        // DocumentViewer calls DocLoader calls LoadDocument calls GetNodePermissions calls this
        getNodePermissions: withResolveShareId(getNodePermissions),
        // Used only in RecentDocumentsService - remove after rollout of DocsLoadRecentsWithDriveSDK
        getNodesAreShared,
        getNodePaths,
        getNodes,
        // DocsTrashWithDriveSDK
        trashDocument: withResolveShareId(trashDocument),
        restoreDocument: withResolveShareId(restoreDocument),
        deleteDocumentPermanently: withResolveShareId(deleteDocumentPermanently),
        // DocsRenameWithDriveSDK
        renameDocument: withResolveShareId(renameDocument),
        // DocsMoveModalDriveSDK
        openMoveToFolderModal,

        modals: (
            <>
                {moveToFolderModal}
                {confirmModal}
            </>
        ),
    };
};
