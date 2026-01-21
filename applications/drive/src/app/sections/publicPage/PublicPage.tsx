import { useEffect } from 'react';
import { useLocation } from 'react-router-dom-v5-compat';

import { useTheme } from '@proton/components';
import { NodeType, useDrive } from '@proton/drive';
import { ThemeTypes } from '@proton/shared/lib/themes/constants';
import useFlag from '@proton/unleash/useFlag';

import { ErrorPage, LoadingPage, PasswordPage } from '../../components/SharedPage';
import config from '../../config';
import LocationErrorBoundary from '../../containers/LocationErrorBoundary';
import PublicSharedLinkContainerLegacy from '../../containers/PublicSharedLinkContainerLegacy';
import { usePartialPublicView } from '../../hooks/util/usePartialPublicView';
import { logging } from '../../modules/logging';
import { TransferManager } from '../../sections/transferManager/TransferManager';
import { deleteStoredUrlPassword } from '../../utils/url/password';
import { PublicFileView } from './PublicFileView';
import { PublicFolderView } from './PublicFolderView';
import { usePublicAuthSession } from './usePublicAuthSession';
import { usePublicLink } from './usePublicLink';

export const PUBLIC_SHARE_SIGNUP_MODAL_KEY = 'public-share-signup-modal';

const PublicPageContent = () => {
    const { drive, init } = useDrive();
    const { setTheme } = useTheme();
    const isPartialView = usePartialPublicView();

    const { resumeSession } = usePublicAuthSession();
    const { rootNode, isLoading, isPasswordNeeded, setCustomPassword, customPassword, loadPublicLink } =
        usePublicLink();

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
            void (async () => {
                await resumeSession();
                loadPublicLink();
            })();
        }
    }, [drive, resumeSession, loadPublicLink]);

    useEffect(() => {
        deleteStoredUrlPassword();
        setTheme(ThemeTypes.Snow);
    }, [setTheme]);

    if (isPasswordNeeded) {
        return (
            <PasswordPage
                submitPassword={async (password) => setCustomPassword(password)}
                isPartialView={isPartialView}
            />
        );
    }

    if (isLoading) {
        return <LoadingPage haveCustomPassword={!!customPassword} isPartialView={isPartialView} />;
    }

    if (!rootNode) {
        return <ErrorPage isPartialView={isPartialView} />;
    }

    return (
        <div className="h-full px-10 pt-3">
            {rootNode.type === NodeType.File ? (
                <PublicFileView rootNode={rootNode} />
            ) : (
                <PublicFolderView nodeUid={rootNode.uid} folderName={rootNode.name} />
            )}
            <TransferManager deprecatedRootShareId={undefined} />
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
