import { useEffect, useState } from 'react';

import { useLoading } from '@proton/hooks';

import { sendErrorReport } from '../../utils/errorHandling';
import { useActions } from '../_actions';
import { DecryptedLink, SignatureIssues, useLink } from '../_links';
import { useShareUrl } from '../_shares';

/**
 * useLinkDetailsView loads link if not cached yet with all signature issues
 * and number of accesses to shared URL.
 */
export default function useLinkDetailsView(shareId: string, linkId: string) {
    const { checkLinkSignatures } = useActions();
    const { loadShareUrlNumberOfAccesses } = useShareUrl();
    const { getLink } = useLink();

    const [link, setLink] = useState<DecryptedLink>();
    const [error, setError] = useState<any>();
    const [isLinkLoading, withLoadingLink] = useLoading();

    const [signatureIssues, setSignatureIssues] = useState<SignatureIssues>();
    const [signatureNetworkError, setSignatureNetworkError] = useState<boolean>(false);
    const [isSignatureIssuesLoading, withLoadingSignatureIssues] = useLoading();

    const [numberOfAccesses, setNumberOfAccesses] = useState<number>();
    const [isNumberOfAccessesLoading, withLoadingNumberOfAccesses] = useLoading();

    useEffect(() => {
        const abortController = new AbortController();
        void withLoadingLink(
            getLink(abortController.signal, shareId, linkId)
                .then((link) => {
                    setLink(link);
                    void withLoadingSignatureIssues(
                        checkLinkSignatures(abortController.signal, shareId, linkId)
                            .then(setSignatureIssues)
                            .catch(() => {
                                setSignatureNetworkError(true);
                            })
                    );
                    if (link.shareId) {
                        void withLoadingNumberOfAccesses(
                            loadShareUrlNumberOfAccesses(abortController.signal, shareId, linkId)
                                .then(setNumberOfAccesses)
                                .catch(sendErrorReport)
                        );
                    }
                })
                .catch((err) => {
                    setError(err);
                    sendErrorReport(err);
                })
        );
        return () => {
            abortController.abort();
        };
    }, [shareId, linkId]);

    return {
        isLinkLoading,
        isSignatureIssuesLoading,
        isNumberOfAccessesLoading,
        error,
        link,
        signatureIssues,
        signatureNetworkError,
        numberOfAccesses,
    };
}
