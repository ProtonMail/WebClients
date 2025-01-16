import { useApi } from '@proton/components';
import { querySharedURLInformation, querySubmitAbuseReport } from '@proton/shared/lib/api/drive/sharing';
import type { SharedURLInfoPayload } from '@proton/shared/lib/interfaces/drive/sharing';

import { usePublicShareStore } from '../../zustand/public/public-share.store';
import { sharedUrlInfoPayloadToSharedUrlInfo, usePublicSession } from '../_api';
import usePublicToken from '../../hooks/drive/usePublicToken';
import { useLink } from '../_links';
import { useDecryptPublicShareLink } from './useDecryptPublicShareLink';

/**
 * usePublicShare loads shared share with link to the store and decrypts them.
 */
export default function usePublicShare() {
    const api = useApi();
    const { token } = usePublicToken();
    const { user, request, getSessionInfo } = usePublicSession();
    const { decryptPublicShareLink } = useDecryptPublicShareLink();
    const { setPublicShare } = usePublicShareStore((state) => ({
        publicShare: state.publicShare,
        setPublicShare: state.setPublicShare,
    }));
    const { getLinkPassphraseAndSessionKey, getLink } = useLink();

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

    const getVirusReportInfo = async ({
        linkId,
        errorMessage,
        rootLinkId,
    }: {
        linkId?: string;
        errorMessage?: string;
        rootLinkId: string;
    }) => {
        // Fallback to rootLink if we don't have linkId (Multiple download as zip)
        const link = await getLink(new AbortController().signal, token, linkId || rootLinkId);
        let comment = `File "${link.name}" is detected as potential malware.`;
        if (errorMessage) {
            comment = `${comment} Message from scanning is "${errorMessage}"`;
        }

        return {
            linkInfo: {
                linkId: link.linkId,
                name: link.name,
                mimeType: link.mimeType,
                size: link.size,
            },
            comment,
        };
    };

    return {
        loadPublicShare,
        submitAbuseReport,
        getVirusReportInfo,
        user,
    };
}
