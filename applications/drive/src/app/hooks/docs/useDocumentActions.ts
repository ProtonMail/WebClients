import { splitNodeUid } from '@proton/drive/index';
import type { ProtonDocumentType } from '@proton/shared/lib/helpers/mimetype';
import { getCurrentTab, getNewWindow } from '@proton/shared/lib/helpers/window';

import type { DocumentType } from './useOpenDocument';
import { useOpenDocument } from './useOpenDocument';

export const useDocumentActions = () => {
    const { openDocumentWindow } = useOpenDocument();

    const openDocument = async ({
        uid,
        openBehavior = 'tab',
        type,
    }: {
        uid: string;
        openBehavior: 'tab' | 'redirect';
        // TODO: see note in `tmpConvertNewTypeToOld` in `useOpenDocument.ts`.
        type: DocumentType | ProtonDocumentType;
    }) => {
        const w = openBehavior === 'tab' ? getNewWindow() : getCurrentTab();
        const { volumeId, nodeId } = splitNodeUid(uid);
        try {
            openDocumentWindow({
                type,
                mode: 'open',
                window: w.handle,
                volumeId,
                linkId: nodeId,
            });
        } catch (e) {
            w.close();
            throw e;
        }
    };

    const createDocument = async ({
        uid,
        parentLinkId,
        type,
    }: {
        uid: string;
        parentLinkId: string;
        type: DocumentType;
    }) => {
        const w = getNewWindow();
        const { volumeId } = splitNodeUid(uid);

        try {
            openDocumentWindow({
                type,
                mode: 'create',
                window: w.handle,
                volumeId,
                parentLinkId,
            });
        } catch (e) {
            w.close();
            throw e;
        }
    };

    const convertDocument = async ({
        uid,
        type,
    }: {
        uid: string;
        // TODO: see note in `tmpConvertNewTypeToOld` in `useOpenDocument.ts`.
        type: DocumentType | ProtonDocumentType;
    }) => {
        const w = getNewWindow();
        const { volumeId, nodeId } = splitNodeUid(uid);

        try {
            openDocumentWindow({
                type,
                mode: 'convert',
                window: w.handle,
                volumeId,
                linkId: nodeId,
            });
        } catch (e) {
            w.close();
            throw e;
        }
    };

    const downloadDocument = async ({ uid, type }: { uid: string; type: DocumentType }) => {
        const w = getNewWindow();
        const { volumeId, nodeId } = splitNodeUid(uid);

        try {
            openDocumentWindow({
                type,
                mode: 'download',
                window: w.handle,
                volumeId,
                linkId: nodeId,
            });
        } catch (e) {
            w.close();
            throw e;
        }
    };

    const openDocumentHistory = async ({ uid, type }: { uid: string; type: DocumentType }) => {
        const w = getNewWindow();
        const { volumeId, nodeId } = splitNodeUid(uid);

        try {
            openDocumentWindow({
                type,
                mode: 'history',
                window: w.handle,
                volumeId,
                linkId: nodeId,
            });
        } catch (e) {
            w.close();
            throw e;
        }
    };

    return {
        openDocument,
        createDocument,
        convertDocument,
        downloadDocument,
        openDocumentHistory,
    };
};
