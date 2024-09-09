import { useApi } from '@proton/components';
import { querySharedURLInformation, querySubmitAbuseReport } from '@proton/shared/lib/api/drive/sharing';
import type { SharedURLInfo } from '@proton/shared/lib/interfaces/drive/sharing';

import { useUserIfAuthenticated } from '../../hooks/util/useUserIfAuthenticated';
import { usePublicSession } from '../_api';
import { useLink } from '../_links';
import { useDecryptPublicShareLink } from './useDecryptPublicShareLink';

/**
 * usePublicShare loads shared share with link to the store and decrypts them.
 */
export default function usePublicShare() {
    const api = useApi();
    const { request, getSessionInfo, isSessionProtonUser } = usePublicSession();
    const { user, isLoading: isUserLoading } = useUserIfAuthenticated(
        isSessionProtonUser(),
        getSessionInfo()?.sessionUid
    );
    const { decryptPublicShareLink } = useDecryptPublicShareLink();
    const { getLinkPassphraseAndSessionKey } = useLink();

    const loadPublicShare = async (abortSignal: AbortSignal) => {
        const sessionInfo = getSessionInfo();
        if (!sessionInfo) {
            throw new Error('Unauthenticated session');
        }

        const { Token } = await request<{ Token: SharedURLInfo }>({
            ...querySharedURLInformation(sessionInfo.token),
            silence: true,
        });

        const link = await decryptPublicShareLink(abortSignal, {
            token: sessionInfo.token,
            urlPassword: sessionInfo.password,
            shareUrlInfo: Token,
        });

        return {
            token: sessionInfo.token,
            link,
        };
    };

    const submitAbuseReport = async (params: {
        linkId: string;
        abuseCategory: string;
        reporterEmail?: string;
        reporterMessage?: string;
    }): Promise<void> => {
        const sessionInfo = getSessionInfo();
        if (!sessionInfo) {
            throw new Error('Unauthenticated session');
        }
        const { token, password } = sessionInfo;
        const ac = new AbortController();
        const { passphrase } = await getLinkPassphraseAndSessionKey(ac.signal, token, params.linkId);

        return api(
            querySubmitAbuseReport({
                ShareURL: window.location.href,
                Password: password,
                AbuseCategory: params.abuseCategory,
                ReporterEmail: params.reporterEmail,
                ReporterMessage: params.reporterMessage,
                ResourcePassphrase: passphrase,
            })
        );
    };

    return {
        loadPublicShare,
        submitAbuseReport,
        user,
        isUserLoading,
    };
}
