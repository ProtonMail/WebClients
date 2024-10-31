import { useCallback, useEffect, useState } from 'react';

import { c } from 'ttag';

import { LocationErrorBoundary } from '@proton/components';
import { useLoading } from '@proton/hooks';
import metrics from '@proton/metrics';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { API_CODES, HTTP_STATUS_CODE } from '@proton/shared/lib/constants';
import { isProtonDocument } from '@proton/shared/lib/helpers/mimetype';
import * as storage from '@proton/shared/lib/helpers/storage';

import { ErrorPage, LoadingPage, PasswordPage, SharedFilePage, SharedFolderPage } from '../components/SharedPage';
import { useSignupFlowModal } from '../components/modals/SignupFlowModal/SignupFlowModal';
import { useUpsellFloatingModal } from '../components/modals/UpsellFloatingModal';
import usePublicToken from '../hooks/drive/usePublicToken';
import { usePartialPublicView } from '../hooks/util/usePartialPublicView';
import type { DecryptedLink } from '../store';
import { PublicDriveProvider, useBookmarksPublicView, useDownload, usePublicAuth, usePublicShare } from '../store';
import { useDriveShareURLBookmarkingFeatureFlag } from '../store/_bookmarks/useDriveShareURLBookmarking';
import { useDriveWebShareURLSignupModal } from '../store/_bookmarks/useDriveWebShareURLSignupModal';
import { useDriveDocsPublicSharingFF, useOpenDocument } from '../store/_documents';
import { sendErrorReport } from '../utils/errorHandling';
import { is4xx, is5xx, isCryptoEnrichedError } from '../utils/errorHandling/apiErrors';
import { Actions, countActionWithTelemetry } from '../utils/telemetry';
import type { ErrorTuple } from '../utils/type/ErrorTuple';
import { deleteStoredUrlPassword } from '../utils/url/password';

export const getErrorMetricTypeOnPublicPage = (error: unknown) => {
    const apiError = getApiError(error);

    if (apiError.status === HTTP_STATUS_CODE.NOT_FOUND || apiError.code === API_CODES.NOT_FOUND_ERROR) {
        return 'does_not_exist_or_expired';
    }

    if (apiError.status && typeof apiError.status === 'number') {
        if (is4xx(apiError.status)) {
            return '4xx';
        }
        if (is5xx(apiError.status)) {
            return '5xx';
        }
    }

    if (isCryptoEnrichedError(error)) {
        return 'crypto';
    }

    return 'unknown';
};

export default function PublicSharedLinkContainer() {
    return (
        <LocationErrorBoundary>
            <PublicDriveProvider>
                <PublicShareLinkInitContainer />
            </PublicDriveProvider>
        </LocationErrorBoundary>
    );
}
export const PUBLIC_SHARE_SIGNUP_MODAL_KEY = 'public-share-signup-modal';

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
    const isDriveWebShareUrlSignupModalEnabled = useDriveWebShareURLSignupModal();
    const [isLoadingDecrypt, withLoading, setLoading] = useLoading(true);
    const [[publicShareError, publicShareErrorMessage], setError] = useState<ErrorTuple>([, '']);
    const [link, setLink] = useState<DecryptedLink>();
    const { loadPublicShare, user } = usePublicShare();
    const bookmarksPublicView = useBookmarksPublicView({ customPassword });
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

    const openInDocs = useCallback(
        (linkId: string) => {
            if (!isDocsPublicSharingEnabled || error) {
                return;
            }

            openDocumentWindow({
                mode: 'open-url',
                token,
                urlPassword,
                linkId,
                window: window,
            });
        },
        [isDocsPublicSharingEnabled, error, token, urlPassword, customPassword]
    );

    // This hook automatically redirects to Docs when opening a document.
    useEffect(() => {
        if (!isDocsPublicSharingEnabled || !link || error) {
            return;
        }

        if (isProtonDocument(link.mimeType)) {
            openInDocs(link.linkId);
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
        if (error) {
            const errorMetricType = getErrorMetricTypeOnPublicPage(error);
            metrics.drive_public_share_load_error_total.increment({
                type: !link ? 'unknown' : link.isFile ? 'file' : 'folder',
                plan: user?.isPaid ? 'paid' : user?.isFree ? 'free' : 'not_recognized',
                error: errorMetricType,
            });

            // We use observability to track this, so we can omit it from Sentry
            if (errorMetricType !== 'does_not_exist_or_expired') {
                if (errorMessage) {
                    sendErrorReport(new Error(errorMessage));
                }
            }
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
        const modalHasBeenShown = !!storage.getItem(PUBLIC_SHARE_SIGNUP_MODAL_KEY);
        /** If the navigation appears from a non proton user and the flag is enabled, we display a sign-up flow modal */
        if (
            isDriveShareUrlBookmarkingEnabled &&
            !isLoggedIn &&
            !isLoading &&
            !modalHasBeenShown &&
            isDriveWebShareUrlSignupModalEnabled
        ) {
            showSignUpFlowModal({ customPassword });
            storage.setItem(PUBLIC_SHARE_SIGNUP_MODAL_KEY, 'true');
        }
    }, [isDriveWebShareUrlSignupModalEnabled, isLoggedIn, isLoading, customPassword]);

    if (isPasswordNeeded) {
        return <PasswordPage submitPassword={submitPassword} />;
    }

    if (showLoadingPage) {
        return <LoadingPage haveCustomPassword={!!customPassword} />;
    }

    if (showErrorPage || !link) {
        return <ErrorPage />;
    }

    const showBookmarks = isDriveShareUrlBookmarkingEnabled || bookmarksPublicView.haveBookmarks;
    const props = {
        bookmarksPublicView,
        token,
        hideSaveToDrive: isLegacy || !showBookmarks,
        openInDocs: isDocsPublicSharingEnabled ? openInDocs : undefined,
        partialView: isPartialView,
    };

    return (
        <>
            {link.isFile ? <SharedFilePage {...props} link={link} /> : <SharedFolderPage {...props} rootLink={link} />}
            {isDriveShareUrlBookmarkingEnabled && isDriveWebShareUrlSignupModalEnabled
                ? signUpFlowModal
                : renderUpsellFloatingModal}
        </>
    );
}
