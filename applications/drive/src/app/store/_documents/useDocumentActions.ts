import { c } from 'ttag';

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

    const openDocument = async ({ shareId, linkId }: { shareId: string; linkId: string }) => {
        openDocumentWindow({
            mode: 'open',
            volumeId: await findVolume(shareId),
            linkId,
        });
    };

    const createDocument = async ({ shareId, parentLinkId }: { shareId: string; parentLinkId: string }) => {
        openDocumentWindow({
            mode: 'create',
            volumeId: await findVolume(shareId),
            parentLinkId,
        });
    };

    const convertDocument = async ({ shareId, linkId }: { shareId: string; linkId: string }) => {
        openDocumentWindow({
            mode: 'convert',
            volumeId: await findVolume(shareId),
            linkId,
        });
    };

    const downloadDocument = async ({ shareId, linkId }: { shareId: string; linkId: string }) => {
        openDocumentWindow({
            mode: 'download',
            volumeId: await findVolume(shareId),
            linkId,
        });
    };

    const openDocumentHistory = async ({ shareId, linkId }: { shareId: string; linkId: string }) => {
        openDocumentWindow({
            mode: 'history',
            volumeId: await findVolume(shareId),
            linkId,
        });
    };

    return {
        openDocument,
        createDocument,
        convertDocument,
        downloadDocument,
        openDocumentHistory,
    };
};
