import { useCallback, useEffect, useState } from 'react';

import { c } from 'ttag';

import { LocationErrorBoundary } from '@proton/components';
import { useLoading } from '@proton/hooks';
import metrics from '@proton/metrics';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { handleDocsCustomPassword } from '@proton/shared/lib/drive/sharing/publicDocsSharing';
import { isProtonDocument } from '@proton/shared/lib/helpers/mimetype';

import { ErrorPage, LoadingPage, PasswordPage, SharedFilePage, SharedFolderPage } from '../components/SharedPage';
import { useSignupFlowModal } from '../components/modals/SignupFlowModal/SignupFlowModal';
import { useUpsellFloatingModal } from '../components/modals/UpsellFloatingModal';
import usePublicToken from '../hooks/drive/usePublicToken';
import { usePartialPublicView } from '../hooks/util/usePartialPublicView';
import type { DecryptedLink } from '../store';
import { PublicDriveProvider, useBookmarksPublicView, useDownload, usePublicAuth, usePublicShare } from '../store';
import { useDriveShareURLBookmarkingFeatureFlag } from '../store/_bookmarks/useDriveShareURLBookmarking';
import { useDriveDocsPublicSharingFF, useOpenDocument } from '../store/_documents';
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
    const isDriveShareUrlBookmarkingEnabled = useDriveShareURLBookmarkingFeatureFlag();
    const [isLoadingDecrypt, withLoading, setLoading] = useLoading(true);
    const [[publicShareError, publicShareErrorMessage], setError] = useState<ErrorTuple>([, '']);
    const [link, setLink] = useState<DecryptedLink>();
    const { loadPublicShare, user } = usePublicShare();
    const bookmarksPublicView = useBookmarksPublicView({ customPassword, user, isAuthLoading: isLoading });
    const [signUpFlowModal, showSignUpFlowModal] = useSignupFlowModal();
    const [renderUpsellFloatingModal] = useUpsellFloatingModal();

    const isLoggedIn = !!user;
    const error: ErrorTuple[0] = authError || publicShareError;
    const errorMessage: ErrorTuple[1] = authErrorMessage || publicShareErrorMessage;

    const isPartialView = usePartialPublicView();

    const { isDocsPublicSharingEnabled } = useDriveDocsPublicSharingFF();
    const { openDocumentWindow } = useOpenDocument();

    const showLoadingPage = isLoading || isLoadingDecrypt;
    const showErrorPage = errorMessage || (showLoadingPage === false && link === undefined);

    const openInDocs = useCallback(() => {
        if (!isDocsPublicSharingEnabled || !link || error) {
            return;
        }

        const w = handleDocsCustomPassword(customPassword);

        openDocumentWindow({
            mode: 'open-url',
            token,
            linkId: link.linkId,
            window: w.handle,
        });
    }, [isDocsPublicSharingEnabled, link, error, token, customPassword]);

    // This hook automatically redirects to Docs when opening a document.
    useEffect(() => {
        if (!isDocsPublicSharingEnabled || !link || error) {
            return;
        }

        if (isProtonDocument(link.mimeType)) {
            openInDocs();
        }
    }, [isDocsPublicSharingEnabled, error, link]);

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

        if (token && !isLoading && !authErrorMessage && !isPasswordNeeded) {
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
    }, [token, isLoading, authErrorMessage, isPasswordNeeded]);

    useEffect(() => {
        /** If the navigation appears from a non proton user and the flag is enabled, we display a sign-up flow modal */
        if (isDriveShareUrlBookmarkingEnabled && !isLoggedIn) {
            showSignUpFlowModal({});
        }
    }, [isDriveShareUrlBookmarkingEnabled, isLoggedIn]);

    if (isPasswordNeeded) {
        return <PasswordPage submitPassword={submitPassword} />;
    }

    if (showLoadingPage) {
        return <LoadingPage partialView={isPartialView} />;
    }

    if (showErrorPage || !link) {
        return <ErrorPage />;
    }

    const props = {
        bookmarksPublicView,
        token,
        hideSaveToDrive: !isDriveShareUrlBookmarkingEnabled || isLegacy,
        openInDocs: isDocsPublicSharingEnabled ? openInDocs : undefined,
        partialView: isPartialView,
    };

    return (
        <>
            {link.isFile ? <SharedFilePage {...props} link={link} /> : <SharedFolderPage {...props} rootLink={link} />}
            {isDriveShareUrlBookmarkingEnabled && !isLoggedIn ? signUpFlowModal : renderUpsellFloatingModal}
        </>
    );
}
