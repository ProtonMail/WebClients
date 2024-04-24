import { useAuthentication } from '@proton/components/hooks';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { APPS } from '@proton/shared/lib/constants';

import { useVolumesState } from '../../store/_volumes';

export const useOpenDocument = () => {
    const { getLocalID } = useAuthentication();
    const volumeState = useVolumesState();

    const openDocument = async ({
        linkId,
        shareId,
        volumeId,
        mode = 'open',
    }: {
        linkId: string;
        shareId: string;
        volumeId?: string;
        mode: 'open' | 'convert';
    }) => {
        const href = getAppHref(`/doc`, APPS.PROTONDOCS, getLocalID());
        const url = new URL(href);

        if (!volumeId) {
            volumeId = volumeState.findVolumeId(shareId);
        }

        if (!volumeId) {
            throw new Error('No volume ID found when opening document');
        }

        url.searchParams.append('mode', mode);
        url.searchParams.append('linkId', linkId);
        url.searchParams.append('volumeId', volumeId);

        if (mode === 'convert') {
            url.searchParams.append('shareId', shareId);
        }

        window.open(url);
    };

    return {
        openDocument,
    };
};

export default useOpenDocument;
