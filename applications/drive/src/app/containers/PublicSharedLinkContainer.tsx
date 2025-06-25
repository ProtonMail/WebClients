import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom-v5-compat';

import { c } from 'ttag';

import { useTheme } from '@proton/components';
import { useLoading } from '@proton/hooks';
import metrics from '@proton/metrics';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { API_CODES, HTTP_STATUS_CODE } from '@proton/shared/lib/constants';
import { handleDocsCustomPassword } from '@proton/shared/lib/drive/sharing/publicDocsSharing';
import { isProtonDocsDocument, isProtonDocsSpreadsheet } from '@proton/shared/lib/helpers/mimetype';
import { getNewWindow } from '@proton/shared/lib/helpers/window';
import { ThemeTypes } from '@proton/shared/lib/themes/constants';
import useFlag from '@proton/unleash/useFlag';

import { ErrorPage, LoadingPage, PasswordPage, SharedFilePage, SharedFolderPage } from '../components/SharedPage';
import { useUpsellFloatingModal } from '../components/modals/UpsellFloatingModal';
import usePublicToken from '../hooks/drive/usePublicToken';
import { usePartialPublicView } from '../hooks/util/usePartialPublicView';
import type { DecryptedLink } from '../store';
import { PublicDriveProvider, useBookmarksPublicView, useDownload, usePublicAuth, usePublicShare } from '../store';
import { useDriveWebShareURLSignupModal } from '../store/_bookmarks/useDriveWebShareURLSignupModal';
import { useDriveDocsPublicSharingFF, useOpenDocument } from '../store/_documents';
import { getMetricsUserPlan } from '../store/_user/getMetricsUserPlan';
import { sendErrorReport } from '../utils/errorHandling';
import { is4xx, is5xx, isCryptoEnrichedError } from '../utils/errorHandling/apiErrors';
import { Actions, countActionWithTelemetry } from '../utils/telemetry';
import type { ErrorTuple } from '../utils/type/ErrorTuple';
import { deleteStoredUrlPassword } from '../utils/url/password';
import LocationErrorBoundary from './LocationErrorBoundary';

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
    const location = useLocation();
    return (
        <LocationErrorBoundary location={location}>
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
    const { setTheme } = useTheme();
    const {
        isLoading,
        customPassword,
        error: [authError, authErrorMessage],
        isLegacy,
        isPasswordNeeded,
        submitPassword,
    } = usePublicAuth(token, urlPassword, 'drive');
    const bookmarksFeatureDisabled = useFlag('DriveShareURLBookmarksDisabled');
    const isDriveWebShareUrlSignupModalEnabled = useDriveWebShareURLSignupModal();
    const [isLoadingDecrypt, withLoading, setLoading] = useLoading(true);
    const [[publicShareError, publicShareErrorMessage], setError] = useState<ErrorTuple>([, '']);
    const [link, setLink] = useState<DecryptedLink>();
    const { loadPublicShare, user } = usePublicShare();
    const bookmarksPublicView = useBookmarksPublicView({ customPassword });
    const [renderUpsellFloatingModal] = useUpsellFloatingModal();

    const error: ErrorTuple[0] = authError || publicShareError;
    const errorMessage: ErrorTuple[1] = authErrorMessage || publicShareErrorMessage;

    const isPartialView = usePartialPublicView();

    const { isDocsPublicSharingEnabled } = useDriveDocsPublicSharingFF();
    const { openDocumentWindow } = useOpenDocument();

    const showLoadingPage = isLoading || isLoadingDecrypt;
    const showErrorPage = errorMessage || (showLoadingPage === false && link === undefined);
    const shouldRedirectToDocs =
        isDocsPublicSharingEnabled &&
        link &&
        link.isFile &&
        (isProtonDocsDocument(link.mimeType) || isProtonDocsSpreadsheet(link.mimeType));
    const isSheet = link && link.isFile && isProtonDocsSpreadsheet(link.mimeType);

    const getDocsWindow = useCallback((redirect: boolean, customPassword: string) => {
        if (redirect) {
            return window;
        }

        if (customPassword) {
            return handleDocsCustomPassword(customPassword).handle;
        }

        return getNewWindow().handle;
    }, []);

    const openInDocs = useCallback(
        (linkId: string, { redirect, download }: { redirect?: boolean; download?: boolean } = {}) => {
            if (!isDocsPublicSharingEnabled || error) {
                return;
            }

            openDocumentWindow({
                type: isSheet ? 'sheet' : 'doc',
                mode: download ? 'open-url-download' : 'open-url',
                token,
                urlPassword,
                linkId,
                window: getDocsWindow(redirect || false, customPassword),
            });
        },
        [isDocsPublicSharingEnabled, error, token, urlPassword, customPassword, getDocsWindow, isSheet]
    );

    // This hook automatically redirects to Docs when opening a document.
    useEffect(() => {
        if (shouldRedirectToDocs) {
            openInDocs(link.linkId, { redirect: true });
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

        // Set default theme to Snow (white)
        setTheme(ThemeTypes.Snow);
    }, []);

    useEffect(() => {
        if (error) {
            const errorMetricType = getErrorMetricTypeOnPublicPage(error);
            metrics.drive_public_share_load_error_total.increment({
                type: !link ? 'unknown' : link.isFile ? 'file' : 'folder',
                plan: getMetricsUserPlan({ user, isPublicContext: true }),
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
                            plan: getMetricsUserPlan({ user, isPublicContext: true }),
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

    if (isPasswordNeeded) {
        return <PasswordPage submitPassword={submitPassword} isPartialView={isPartialView} />;
    }

    if (showLoadingPage) {
        return <LoadingPage haveCustomPassword={!!customPassword} isPartialView={isPartialView} />;
    }

    if (showErrorPage || !link) {
        return <ErrorPage isPartialView={isPartialView} />;
    }

    const showBookmarks = !bookmarksFeatureDisabled || bookmarksPublicView.haveBookmarks;
    const props = {
        bookmarksPublicView,
        token,
        hideSaveToDrive: isLegacy || !showBookmarks,
        openInDocs: isDocsPublicSharingEnabled ? openInDocs : undefined,
        isPartialView,
        rootLink: link,
    };

    if (shouldRedirectToDocs) {
        return null;
    }

    return (
        <>
            {link.isFile ? <SharedFilePage {...props} /> : <SharedFolderPage {...props} />}
            {!bookmarksFeatureDisabled && isDriveWebShareUrlSignupModalEnabled ? null : renderUpsellFloatingModal}
        </>
    );
}
