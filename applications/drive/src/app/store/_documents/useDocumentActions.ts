import { c } from 'ttag';

import { EnrichedError } from '../../utils/errorHandling/EnrichedError';
import { useVolumesState } from '../_volumes';
import { useOpenDocument } from './useOpenDocument';

export const useDocumentActions = () => {
    const volumeState = useVolumesState();
    const { openDocumentWindow } = useOpenDocument();

    const findVolume = (shareId: string) => {
        // We can't pass volumeId easily everywhere in Drive, so let's try to
        // resolve it from cache to avoid having to write volume-finding logic everywhere
        const volumeId = volumeState.findVolumeId(shareId);

        if (!volumeId) {
            throw new EnrichedError(
                // translator: Error message when failure to open Proton Docs document
                c('Notification').t`Failed to open document`,
                {
                    tags: { shareId },
                },
                'No volume ID found when opening document'
            );
        }

        return volumeId;
    };

    const openDocument = ({ shareId, linkId }: { shareId: string; linkId: string }) => {
        openDocumentWindow({
            mode: 'open',
            volumeId: findVolume(shareId),
            linkId,
        });
    };

    const createDocument = ({ shareId, parentLinkId }: { shareId: string; parentLinkId: string }) => {
        openDocumentWindow({
            mode: 'create',
            volumeId: findVolume(shareId),
            parentLinkId,
        });
    };

    const convertDocument = ({ shareId, linkId }: { shareId: string; linkId: string }) => {
        openDocumentWindow({
            mode: 'convert',
            volumeId: findVolume(shareId),
            linkId,
        });
    };

    const downloadDocument = ({ shareId, linkId }: { shareId: string; linkId: string }) => {
        openDocumentWindow({
            mode: 'download',
            volumeId: findVolume(shareId),
            linkId,
        });
    };

    return {
        openDocument,
        createDocument,
        convertDocument,
        downloadDocument,
    };
};
