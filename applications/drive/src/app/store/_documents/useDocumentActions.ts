import { c } from 'ttag';

import type { ProtonDocumentType } from '@proton/shared/lib/helpers/mimetype';
import { getCurrentTab, getNewWindow } from '@proton/shared/lib/helpers/window';

import { EnrichedError } from '../../utils/errorHandling/EnrichedError';
/**
 * @DRIVE-STORE: Direct import from files required by drive-store. Do not import from index.
 */
import useShare from '../_shares/useShare';
import useAbortSignal from '../_views/utils/useAbortSignal';
import useVolumesState from '../_volumes/useVolumesState';
import type { DocumentType } from './useOpenDocument';
import { useOpenDocument } from './useOpenDocument';

export const useDocumentActions = () => {
    const volumeState = useVolumesState();
    const { getShare } = useShare();
    const { openDocumentWindow } = useOpenDocument();
    const abortSignal = useAbortSignal([]);

    const findVolume = async (shareId: string): Promise<string> => {
        // We can't pass volumeId easily everywhere in Drive, so let's try to
        // resolve it from cache to avoid having to write volume-finding logic everywhere
        const volumeId = volumeState.findVolumeId(shareId);

        if (!volumeId) {
            // Try to fetch the share in case it's not in the cache
            try {
                const share = await getShare(abortSignal, shareId);
                return share.volumeId;
            } catch (e) {
                throw new EnrichedError(
                    // translator: Error message when failure to open Proton Docs document
                    c('Notification').t`Failed to open document`,
                    {
                        tags: { shareId },
                        extra: { e },
                    },
                    'No volume ID found when opening document'
                );
            }
        }

        return volumeId;
    };

    const openDocument = async ({
        shareId,
        linkId,
        openBehavior = 'tab',
        type,
    }: {
        shareId: string;
        linkId: string;
        openBehavior: 'tab' | 'redirect';
        // TODO: see note in `tmpConvertNewTypeToOld` in `useOpenDocument.ts`.
        type: DocumentType | ProtonDocumentType;
    }) => {
        const w = openBehavior === 'tab' ? getNewWindow() : getCurrentTab();

        try {
            openDocumentWindow({
                type,
                mode: 'open',
                window: w.handle,
                volumeId: await findVolume(shareId),
                linkId,
            });
        } catch (e) {
            w.close();
            throw e;
        }
    };

    const createDocument = async ({
        shareId,
        parentLinkId,
        type,
    }: {
        shareId: string;
        parentLinkId: string;
        type: DocumentType;
    }) => {
        const w = getNewWindow();

        try {
            // TODO:EVENTS doesn't seem to be returning an id we can use to get the Node
            openDocumentWindow({
                type,
                mode: 'create',
                window: w.handle,
                volumeId: await findVolume(shareId),
                parentLinkId,
            });
        } catch (e) {
            w.close();
            throw e;
        }
    };

    const convertDocument = async ({
        shareId,
        linkId,
        type,
    }: {
        shareId: string;
        linkId: string;
        // TODO: see note in `tmpConvertNewTypeToOld` in `useOpenDocument.ts`.
        type: DocumentType | ProtonDocumentType;
    }) => {
        const w = getNewWindow();

        try {
            openDocumentWindow({
                type,
                mode: 'convert',
                window: w.handle,
                volumeId: await findVolume(shareId),
                linkId,
            });
        } catch (e) {
            w.close();
            throw e;
        }
    };

    const downloadDocument = async ({
        shareId,
        linkId,
        type,
    }: {
        shareId: string;
        linkId: string;
        type: DocumentType;
    }) => {
        const w = getNewWindow();

        try {
            openDocumentWindow({
                type,
                mode: 'download',
                window: w.handle,
                volumeId: await findVolume(shareId),
                linkId,
            });
        } catch (e) {
            w.close();
            throw e;
        }
    };

    const openDocumentHistory = async ({
        shareId,
        linkId,
        type,
    }: {
        shareId: string;
        linkId: string;
        type: DocumentType;
    }) => {
        const w = getNewWindow();

        try {
            openDocumentWindow({
                type,
                mode: 'history',
                window: w.handle,
                volumeId: await findVolume(shareId),
                linkId,
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
