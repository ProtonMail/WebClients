import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { LocationErrorBoundary } from '@proton/components';
import { useLoading } from '@proton/hooks';
import metrics from '@proton/metrics';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';

import { ErrorPage, LoadingPage, PasswordPage, SharedFilePage, SharedFolderPage } from '../components/SharedPage';
import { useSignupFlowModal } from '../components/modals/SignupFlowModal/SignupFlowModal';
import { useUpsellFloatingModal } from '../components/modals/UpsellFloatingModal';
import usePublicToken from '../hooks/drive/usePublicToken';
import type { DecryptedLink } from '../store';
import { PublicDriveProvider, useBookmarksPublicView, useDownload, usePublicAuth, usePublicShare } from '../store';
import { useDriveShareURLBookmarkingFeatureFlag } from '../store/_bookmarks/useDriveShareURLBookmarking';
import { sendErrorReport } from '../utils/errorHandling';
import { getErrorMetricType } from '../utils/errorHandling/apiErrors';
import { Actions, countActionWithTelemetry } from '../utils/telemetry';
import type { ErrorTuple } from '../utils/type/ErrorTuple';
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
    const {
        isLoading,
        customPassword,
        error: [authError, authErrorMessage],
        isLegacy,
        isPasswordNeeded,
        submitPassword,
    } = usePublicAuth(token, urlPassword);
    const bookmarksPublicView = useBookmarksPublicView(customPassword);
    const isDriveShareUrlBookmarkingEnabled = useDriveShareURLBookmarkingFeatureFlag();
    const [isLoadingDecrypt, withLoading, setLoading] = useLoading(true);
    const [[publicShareError, publicShareErrorMessage], setError] = useState<ErrorTuple>([, '']);
    const [link, setLink] = useState<DecryptedLink>();
    const { loadPublicShare, user, isUserLoading } = usePublicShare();
    const [signUpFlowModal, showSignUpFlowModal] = useSignupFlowModal();
    const [renderUpsellFloatingModal] = useUpsellFloatingModal();

    const isLoggedIn = !!user;
    const error: ErrorTuple[0] = authError || publicShareError;
    const errorMessage: ErrorTuple[1] = authErrorMessage || publicShareErrorMessage;

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
        if (errorMessage) {
            sendErrorReport(new Error(errorMessage));
        }
        if (error) {
            metrics.drive_public_share_load_error_total.increment({
                type: !link ? 'unknown' : link.isFile ? 'file' : 'folder',
                plan: user?.isPaid ? 'paid' : user?.isFree ? 'free' : 'not_recognized',
                error: getErrorMetricType(error),
            });
        }
    }, [errorMessage, error]);

    useEffect(() => {
        const abortController = new AbortController();

        if (token && !isLoading && !authErrorMessage && !isPasswordNeeded && !isUserLoading) {
            void withLoading(
                loadPublicShare(abortController.signal)
                    .then(({ link }) => {
                        setLink(link);
                        metrics.drive_public_share_load_success_total.increment({
                            type: link.isFile ? 'file' : 'folder',
                            plan: user?.isPaid ? 'paid' : user?.isFree ? 'free' : 'not_recognized',
                        });
                        countActionWithTelemetry(Actions.PublicLinkVisit);
                    })
                    .catch((error) => {
                        console.error(error);
                        const apiError = getApiError(error);
                        setError([error, apiError.message || error.message || c('Info').t`Cannot load shared link`]);
                    })
            );
        } else if (authErrorMessage) {
            setLoading(false);
        }

        return () => {
            abortController.abort();
        };
    }, [token, isLoading, authErrorMessage, isPasswordNeeded, isUserLoading]);

    useEffect(() => {
        /** If the navigation appears from a non proton user and the flag is enabled, we display a sign-up flow modal */
        if (isDriveShareUrlBookmarkingEnabled && !isLoggedIn && !isUserLoading) {
            showSignUpFlowModal({ urlPassword });
        }
    }, [isDriveShareUrlBookmarkingEnabled, isLoggedIn, isUserLoading]);

    const showLoadingPage = isLoading || isLoadingDecrypt;
    const showErrorPage = errorMessage || (showLoadingPage === false && link === undefined);

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
                <SharedFilePage
                    bookmarksPublicView={bookmarksPublicView}
                    token={token}
                    link={link}
                    hideSaveToDrive={!isDriveShareUrlBookmarkingEnabled || isLegacy}
                />
            ) : (
                <SharedFolderPage
                    bookmarksPublicView={bookmarksPublicView}
                    token={token}
                    rootLink={link}
                    hideSaveToDrive={!isDriveShareUrlBookmarkingEnabled || isLegacy}
                />
            )}
            {isDriveShareUrlBookmarkingEnabled && !isLoggedIn ? signUpFlowModal : renderUpsellFloatingModal}
        </>
    );
}
