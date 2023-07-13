import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { LocationErrorBoundary } from '@proton/components';
import { useLoading } from '@proton/hooks';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';

import { ErrorPage, LoadingPage, PasswordPage, SharedFilePage, SharedFolderPage } from '../components/SharedPage';
import usePublicToken from '../hooks/drive/usePublicToken';
import { DecryptedLink, PublicDriveProvider, useDownload, usePublicAuth, usePublicShare } from '../store';

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
    const { isLoading, error, isPasswordNeeded, submitPassword } = usePublicAuth(token, urlPassword);

    // If password to the share was changed, page need to reload everything.
    // In such case we need to also clear all downloads to not keep anything
    // from before.
    useEffect(() => {
        if (isLoading) {
            clearDownloads();
        }
    }, [isLoading]);

    if (isLoading) {
        return <LoadingPage />;
    }

    if (error) {
        return <ErrorPage />;
    }

    if (isPasswordNeeded) {
        return <PasswordPage submitPassword={submitPassword} />;
    }

    return <PublicSharedLink token={token} />;
}

/**
 * PublicSharedLink loads and decrypt the public share.
 * Based on the link it renders shared file or folder page.
 */
function PublicSharedLink({ token }: { token: string }) {
    const { loadPublicShare } = usePublicShare();
    const [isLoading, withLoading] = useLoading(true);
    const [link, setLink] = useState<DecryptedLink>();
    const [error, setError] = useState<string>();

    useEffect(() => {
        const abortController = new AbortController();
        void withLoading(
            loadPublicShare(abortController.signal)
                .then(({ link }) => setLink(link))
                .catch((error) => {
                    console.error(error);
                    const apiError = getApiError(error);
                    setError(apiError.message || error.message || c('Info').t`Cannot load shared link`);
                })
        );
        return () => {
            abortController.abort();
        };
    }, []);

    if (isLoading) {
        return <LoadingPage />;
    }

    if (error || !link) {
        return <ErrorPage />;
    }

    if (link.isFile) {
        return <SharedFilePage token={token} link={link} />;
    }
    return <SharedFolderPage token={token} rootLink={link} />;
}
