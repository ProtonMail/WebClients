import { useEffect, useState } from 'react';

import { useLoading } from '@proton/hooks';
import { SHARE_MEMBER_PERMISSIONS } from '@proton/shared/lib/drive/constants';

import { sendErrorReport } from '../../utils/errorHandling';
import { useActions } from '../_actions';
import type { DecryptedLink, SignatureIssues } from '../_links';
import { useLink } from '../_links';
import { useShareUrl } from '../_shares';
import { useDirectSharingInfo } from '../_shares/useDirectSharingInfo';

/**
 * useLinkDetailsView loads link if not cached yet with all signature issues
 * and number of accesses to shared URL.
 */
export default function useLinkDetailsView(shareId: string, linkId: string) {
    const { checkLinkSignatures } = useActions();
    const { loadShareUrlNumberOfAccesses } = useShareUrl();
    const { getLink } = useLink();
    const { isSharedWithMe, getSharePermissions } = useDirectSharingInfo();

    // permissions load will be during the withLoading process, but we prefer to set owner by default,
    // so even if it's wrong permissions, BE will prevent any unauthorized actions
    const [permissions, setPermissions] = useState<SHARE_MEMBER_PERMISSIONS>(SHARE_MEMBER_PERMISSIONS.OWNER);
    const [link, setLink] = useState<DecryptedLink>();
    const [error, setError] = useState<any>();
    const [isSharedWithMeLink, setIsSharedWithMeLink] = useState(false);
    const [isLinkLoading, withLoadingLink] = useLoading();

    const [signatureIssues, setSignatureIssues] = useState<SignatureIssues>();
    const [signatureNetworkError, setSignatureNetworkError] = useState<boolean>(false);
    const [isSignatureIssuesLoading, withLoadingSignatureIssues] = useLoading();

    const [numberOfAccesses, setNumberOfAccesses] = useState<number>();
    const [isNumberOfAccessesLoading, withLoadingNumberOfAccesses] = useLoading();

    useEffect(() => {
        const abortController = new AbortController();
        void withLoadingLink(async () => {
            try {
                await getSharePermissions(abortController.signal, shareId).then(setPermissions);

                const link = await getLink(abortController.signal, shareId, linkId);
                setLink(link);
                void withLoadingSignatureIssues(
                    checkLinkSignatures(abortController.signal, shareId, linkId)
                        .then(setSignatureIssues)
                        .catch(() => {
                            setSignatureNetworkError(true);
                        })
                );
                const sharedWithMe = await isSharedWithMe(abortController.signal, shareId);
                setIsSharedWithMeLink(sharedWithMe);
                if (link.shareId && !sharedWithMe) {
                    void withLoadingNumberOfAccesses(
                        loadShareUrlNumberOfAccesses(abortController.signal, shareId, linkId)
                            .then(setNumberOfAccesses)
                            .catch(sendErrorReport)
                    );
                }
            } catch (err) {
                setError(err);
                sendErrorReport(err);
            }
        });

        return () => {
            abortController.abort();
        };
    }, [shareId, linkId]);

    return {
        permissions,
        isLinkLoading,
        isSignatureIssuesLoading,
        isNumberOfAccessesLoading,
        isSharedWithMeLink,
        error,
        link,
        signatureIssues,
        signatureNetworkError,
        numberOfAccesses,
    };
}
