import { querySharedURLInformation } from '@proton/shared/lib/api/drive/sharing';
import type { SharedURLInfoPayload } from '@proton/shared/lib/interfaces/drive/sharing';

import { usePublicShareStore } from '../../zustand/public/public-share.store';
import { sharedUrlInfoPayloadToSharedUrlInfo } from '../_api/transformers';
import usePublicSession from '../_api/usePublicSession';
import { useDecryptPublicShareLink } from './useDecryptPublicShareLink';

/**
 * usePublicShare loads shared share with link to the store and decrypts them.
 */
export default function usePublicShare() {
    const { request, getSessionInfo } = usePublicSession();
    const { decryptPublicShareLink } = useDecryptPublicShareLink();
    const { setPublicShare } = usePublicShareStore((state) => ({
        publicShare: state.publicShare,
        setPublicShare: state.setPublicShare,
    }));

    const loadPublicShare = async (abortSignal: AbortSignal) => {
        const sessionInfo = getSessionInfo();
        if (!sessionInfo) {
            throw new Error('Unauthenticated session');
        }

        const { Token } = await request<{ Token: SharedURLInfoPayload }>(
            {
                ...querySharedURLInformation(sessionInfo.token),
                silence: true,
            },
            abortSignal
        );
        const sharedUrlInfo = sharedUrlInfoPayloadToSharedUrlInfo(Token);

        const link = await decryptPublicShareLink(abortSignal, {
            token: sessionInfo.token,
            urlPassword: sessionInfo.password,
            sharedUrlInfo,
        });

        const publicShare = {
            sharedUrlInfo,
            link,
        };
        setPublicShare(publicShare);

        return publicShare;
    };

    return {
        loadPublicShare,
    };
}
