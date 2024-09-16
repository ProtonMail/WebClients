import { c } from 'ttag';

import { getCurrentTab, getNewWindow } from '@proton/shared/lib/helpers/window';

import { EnrichedError } from '../../utils/errorHandling/EnrichedError';
import { useShare } from '../_shares';
import { useAbortSignal } from '../_views/utils';
import { useVolumesState } from '../_volumes';
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
    }: {
        shareId: string;
        linkId: string;
        openBehavior: 'tab' | 'redirect';
    }) => {
        const w = openBehavior === 'tab' ? getNewWindow() : getCurrentTab();

        try {
            openDocumentWindow({
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

    const createDocument = async ({ shareId, parentLinkId }: { shareId: string; parentLinkId: string }) => {
        const w = getNewWindow();

        try {
            openDocumentWindow({
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

    const convertDocument = async ({ shareId, linkId }: { shareId: string; linkId: string }) => {
        const w = getNewWindow();

        try {
            openDocumentWindow({
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

    const downloadDocument = async ({ shareId, linkId }: { shareId: string; linkId: string }) => {
        const w = getNewWindow();

        try {
            openDocumentWindow({
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

    const openDocumentHistory = async ({ shareId, linkId }: { shareId: string; linkId: string }) => {
        const w = getNewWindow();

        try {
            openDocumentWindow({
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
