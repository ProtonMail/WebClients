import { PublicKeyReference } from '@proton/crypto/lib';

import { useDriveCrypto } from '../store/_crypto';
import { useOpenDocument } from '../store/_documents';
import { DocumentKeys, DocumentManifest, DocumentNode, DocumentNodeMeta, useDocuments } from './_documents';
import { useMyFiles, useResolveShareId } from './_shares';
import { NodeMeta } from './interface';

interface DriveInterface {
    /**
     * Creates an empty document node (document shell).
     */
    createDocumentNode: (meta: NodeMeta, name: string) => Promise<DocumentNodeMeta>;

    /**
     * Gets the content key for a given document node.
     */
    getDocumentKeys: (meta: NodeMeta) => Promise<DocumentKeys>;

    /**
     * Gets a document node, either from cache or fetched.
     */
    getDocumentNode: (meta: NodeMeta) => Promise<DocumentNode>;

    /**
     * Renames a document node.
     */
    renameDocument: (meta: NodeMeta, newName: string) => Promise<void>;

    /**
     * Gets the URL for a given document.
     */
    getDocumentUrl: (meta: NodeMeta) => URL;

    /**
     * Generates and signs the manifest for a given document.
     *
     * Assumes document is only one-block, passed in the `content` argument.
     */
    signDocumentManifest: (meta: NodeMeta, content: Uint8Array) => Promise<DocumentManifest>;

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
}

export const useDriveCompat = (): DriveInterface => {
    const { withResolve } = useResolveShareId();

    const {
        createDocumentNode,
        getDocumentKeys,
        getDocumentNode,
        renameDocument,
        getDocumentUrl,
        signDocumentManifest,
    } = useDocuments();
    const { getMyFilesNodeMeta } = useMyFiles();
    const { openDocumentWindow } = useOpenDocument();
    const { getVerificationKey } = useDriveCrypto();

    const openDocument = (meta: NodeMeta) => openDocumentWindow({ ...meta, mode: 'open' });

    return {
        createDocumentNode: withResolve(createDocumentNode),
        getDocumentKeys: withResolve(getDocumentKeys),
        getDocumentNode: withResolve(getDocumentNode),
        renameDocument: withResolve(renameDocument),
        getDocumentUrl,
        openDocument,
        signDocumentManifest: withResolve(signDocumentManifest),
        getMyFilesNodeMeta,
        getVerificationKey,
    };
};
