import { useApi } from '@proton/components';
import { CryptoProxy } from '@proton/crypto';
import { querySharedURLInformation, querySubmitAbuseReport } from '@proton/shared/lib/api/drive/sharing';
import { LinkType } from '@proton/shared/lib/interfaces/drive/link';
import { SharedURLInfo } from '@proton/shared/lib/interfaces/drive/sharing';
import { computeKeyPassword } from '@proton/srp';

import { usePublicSession } from '../_api';
import { useLink } from '../_links';
import useLinksState from '../_links/useLinksState';
import useSharesKeys from './useSharesKeys';

/**
 * usePublicShare loads shared share with link to the store and decrypts them.
 */
export default function usePublicShare() {
    const api = useApi();
    const { request, getSessionInfo } = usePublicSession();
    const sharesKeys = useSharesKeys();
    const { setLinks } = useLinksState();
    const { getLink, getLinkPassphraseAndSessionKey } = useLink();

    const loadPublicShare = async (abortSignal: AbortSignal) => {
        const sessionInfo = getSessionInfo();
        if (!sessionInfo) {
            throw new Error('Unauthenticated session');
        }

        const { Token } = await request<{ Token: SharedURLInfo }>({
            ...querySharedURLInformation(sessionInfo.token),
            silence: true,
        });

        const computedPassword = await computeKeyPassword(sessionInfo.password, Token.SharePasswordSalt);
        const sharePassphrase = await CryptoProxy.decryptMessage({
            armoredMessage: Token.SharePassphrase,
            passwords: [computedPassword],
        });

        const sharePrivateKey = await CryptoProxy.importPrivateKey({
            armoredKey: Token.ShareKey,
            passphrase: sharePassphrase.data,
        });
        sharesKeys.set(sessionInfo.token, sharePrivateKey);

        setLinks(sessionInfo.token, [
            {
                encrypted: {
                    linkId: Token.LinkID,
                    parentLinkId: '',
                    isFile: Token.LinkType === LinkType.FILE,
                    name: Token.Name,
                    mimeType: Token.MIMEType,
                    size: Token.Size,
                    createTime: Token.CreateTime,
                    metaDataModifyTime: Token.CreateTime,
                    trashed: null,
                    hasThumbnail: Token.ThumbnailURLInfo !== undefined,
                    isShared: false,
                    nodeKey: Token.NodeKey,
                    nodePassphrase: Token.NodePassphrase,
                    contentKeyPacket: Token.ContentKeyPacket,
                    xAttr: '',
                },
            },
        ]);
        const link = await getLink(abortSignal, sessionInfo.token, Token.LinkID);

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
    };
}
