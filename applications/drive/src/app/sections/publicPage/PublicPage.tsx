import { useEffect } from 'react';
import { useLocation } from 'react-router-dom-v5-compat';

import { useActiveBreakpoint, useAppTitle, useTheme } from '@proton/components';
import { NodeType, useDrive } from '@proton/drive';
import { ThemeTypes } from '@proton/shared/lib/themes/constants';
import useFlag from '@proton/unleash/useFlag';

import config from '../../config';
import LocationErrorBoundary from '../../containers/LocationErrorBoundary';
import PublicSharedLinkContainerLegacy from '../../containers/PublicSharedLinkContainerLegacy';
import { usePartialPublicView } from '../../hooks/util/usePartialPublicView';
import { logging } from '../../modules/logging';
import { TransferManager } from '../../sections/transferManager/TransferManager';
import { deleteStoredUrlPassword } from '../../utils/url/password';
import { PublicFileView } from './PublicFileView';
import { PublicFolderView } from './PublicFolderView';
import { PublicPageError } from './PublicPageError';
import { PublicPageLoader } from './PublicPageLoader';
import { PublicPagePassword } from './PublicPagePassword';
import ReportAbuseButton from './ReportAbuseButton';
import { usePublicActions } from './actions/usePublicActions';
import { usePublicAuthStore } from './usePublicAuth.store';
import { usePublicAuthSession } from './usePublicAuthSession';
import { usePublicLink } from './usePublicLink';

import './PublicPage.scss';

export const PUBLIC_SHARE_SIGNUP_MODAL_KEY = 'public-share-signup-modal';

const PublicPageContent = () => {
    const { drive, init } = useDrive();
    const { setTheme } = useTheme();
    const { resumeSession } = usePublicAuthSession();
    const { rootNode, isLoading, isPasswordNeeded, customPassword, loadPublicLink } = usePublicLink();
    const isPartialView = usePartialPublicView();
    const { handleReportAbuse, modals } = usePublicActions();
    const { viewportWidth } = useActiveBreakpoint();

    useAppTitle(rootNode?.name);

    useEffect(() => {
        if (!drive) {
            init({
                appName: config.APP_NAME,
                appVersion: config.APP_VERSION,
                logging,
            });
        }
    }, [drive, init]);

    useEffect(() => {
        if (drive) {
            const initializePublicLink = async () => {
                await resumeSession();
                await loadPublicLink();
            };
            void initializePublicLink();
        }
    }, [drive, resumeSession, loadPublicLink]);

    useEffect(() => {
        deleteStoredUrlPassword();
        setTheme(ThemeTypes.Snow);
    }, [setTheme]);

    if (isPasswordNeeded) {
        return <PublicPagePassword submitPassword={loadPublicLink} />;
    }

    if (isLoading) {
        return <PublicPageLoader />;
    }

    if (!rootNode) {
        return <PublicPageError />;
    }

    return (
        <div className="h-full md:px-10 md:pt-3 pb-16 md:pb-0">
            {rootNode.type === NodeType.File ? (
                <PublicFileView rootNode={rootNode} customPassword={customPassword} isPartialView={isPartialView} />
            ) : (
                <PublicFolderView rootNode={rootNode} customPassword={customPassword} isPartialView={isPartialView} />
            )}
            <TransferManager
                deprecatedRootShareId={undefined}
                className="public-page-transfer-manager"
                onReportAbuse={(nodeUid, prefill) =>
                    handleReportAbuse(nodeUid, customPassword, {
                        ...prefill,
                        email: usePublicAuthStore.getState().getUserMainAddress()?.email,
                    })
                }
            />
            {!viewportWidth['<=small'] && (
                <ReportAbuseButton
                    className="ml-0.5 mb-0.5 fixed left-0 bottom-0"
                    onClick={() =>
                        handleReportAbuse(rootNode.uid, customPassword, {
                            email: usePublicAuthStore.getState().getUserMainAddress()?.email,
                        })
                    }
                />
            )}
            {modals.reportAbuseModal}
        </div>
    );
};

export function PublicPage() {
    const useDriveSDKPublicLink = useFlag('DriveWebSDKPublic');
    const location = useLocation();
    if (!useDriveSDKPublicLink) {
        return <PublicSharedLinkContainerLegacy />;
    }
    return (
        <LocationErrorBoundary location={location}>
            <PublicPageContent />
        </LocationErrorBoundary>
    );
}
