import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { LocationErrorBoundary } from '@proton/components';
import { isProtonUserFromCookie } from '@proton/components/helpers/protonUserCookie';
import { useLoading } from '@proton/hooks';
import metrics from '@proton/metrics';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';

import { ErrorPage, LoadingPage, PasswordPage, SharedFilePage, SharedFolderPage } from '../components/SharedPage';
import { SignUpFlowModal } from '../components/SharedPage/Bookmarks/SignUpFlowModal';
import usePublicToken from '../hooks/drive/usePublicToken';
import type { DecryptedLink } from '../store';
import { PublicDriveProvider, useDownload, usePublicAuth, usePublicShare } from '../store';
import { useDriveShareURLBookmarkingFeatureFlag } from '../store/_shares/useDriveShareURLBookmarking';
import { sendErrorReport } from '../utils/errorHandling';
import { deleteStoredUrlPassword } from '../utils/url/password';

export default function PublicSharedLinkContainer() {
    return (
        <LocationErrorBoundary>
            <PublicDriveProvider>
                <PublicShareLinkInitContainer />
            </PublicDriveProvider>
        </LocationErrorBoundary>
    );
}

/**
 * PublicShareLinkInitContainer initiate public session for shared link.
 * That is to initiate SRP handshake and ask for password if needed to
 * initiate session itself.
 */
function PublicShareLinkInitContainer() {
    const { clearDownloads } = useDownload();
    const { token, urlPassword } = usePublicToken();
    const { isLoading, error: authError, isPasswordNeeded, submitPassword } = usePublicAuth(token, urlPassword);
    const isDriveShareUrlBookmarkingEnabled = useDriveShareURLBookmarkingFeatureFlag();
    const isProtonUser = isProtonUserFromCookie();
    const [isLoadingDecrypt, withLoading, setLoading] = useLoading(true);
    const [errorMessage, setError] = useState<string | undefined>();
    const [link, setLink] = useState<DecryptedLink>();
    const { loadPublicShare, user } = usePublicShare();

    // If password to the share was changed, page need to reload everything.
    // In such case we need to also clear all downloads to not keep anything
    // from before.
    useEffect(() => {
        if (isLoading) {
            clearDownloads();
        }
    }, [isLoading]);

    useEffect(() => {
        // Always delete saved public share URL when browsing a public share url
        deleteStoredUrlPassword();
    }, []);

    useEffect(() => {
        const error = authError || errorMessage;
        if (error) {
            sendErrorReport(new Error(error));
        }
    }, [authError, errorMessage]);

    useEffect(() => {
        const abortController = new AbortController();

        if (token && !isLoading && !authError && !isPasswordNeeded) {
            void withLoading(
                loadPublicShare(abortController.signal)
                    .then(({ link }) => {
                        setLink(link);
                        metrics.drive_public_share_load_success_total.increment({
                            type: link?.isFile ? 'file' : 'folder',
                            plan: user?.isPaid ? 'paid' : user?.isFree ? 'free' : 'not_recognized',
                        });
                    })
                    .catch((error) => {
                        console.error(error);
                        const apiError = getApiError(error);
                        setError(apiError.message || error.message || c('Info').t`Cannot load shared link`);
                    })
            );
        } else if (authError) {
            setLoading(false);
        }

        return () => {
            abortController.abort();
        };
    }, [token, isLoading, authError, isPasswordNeeded]);

    const showLoadingPage = isLoading || isLoadingDecrypt;
    const showErrorPage = authError || errorMessage || (showLoadingPage === false && link === undefined);

    if (isPasswordNeeded) {
        return <PasswordPage submitPassword={submitPassword} />;
    }

    if (showLoadingPage) {
        return <LoadingPage />;
    }

    if (showErrorPage || !link) {
        return <ErrorPage />;
    }

    return (
        <>
            {link.isFile ? (
                <SharedFilePage token={token} link={link} />
            ) : (
                <SharedFolderPage token={token} rootLink={link} />
            )}
            {/** If the navigation appears from a non proton user and the flag is enabled, we display a sign-up flow modal */}
            {isDriveShareUrlBookmarkingEnabled && !isProtonUser && <SignUpFlowModal urlPassword={urlPassword} />}
        </>
    );
}
