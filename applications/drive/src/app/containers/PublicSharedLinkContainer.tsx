import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom-v5-compat';

import { useApi, useAuthentication, useTheme } from '@proton/components';
import { type NodeEntity, NodeType, getDrive, useDrive } from '@proton/drive';
import { uploadManager } from '@proton/drive/modules/upload';
import { resumeSession } from '@proton/shared/lib/authentication/persistedSessionHelper';
import { ThemeTypes } from '@proton/shared/lib/themes/constants';
import useFlag from '@proton/unleash/useFlag';

import { ErrorPage, LoadingPage, PasswordPage } from '../components/SharedPage';
import config from '../config';
import { usePartialPublicView } from '../hooks/util/usePartialPublicView';
import { logging } from '../modules/logging';
import { PublicFolderView } from '../sections/publicPage/PublicFolderView';
import { setPublicLinkClient } from '../sections/publicPage/publicLinkClient';
import { TransferManager } from '../sections/transferManager/TransferManager';
import { handleSdkError } from '../utils/errorHandling/useSdkErrorHandler';
import { getLastActivePersistedUserSession } from '../utils/lastActivePersistedUserSession';
import { getNodeEntity } from '../utils/sdk/getNodeEntity';
import { deleteStoredUrlPassword } from '../utils/url/password';
import LocationErrorBoundary from './LocationErrorBoundary';
import PublicSharedLinkContainerLegacy from './PublicSharedLinkContainerLegacy';

export function PublicSharedLinkContainer() {
    const useDriveSDKPublicLink = useFlag('DriveWebSDKPublic');
    const location = useLocation();
    if (!useDriveSDKPublicLink) {
        return <PublicSharedLinkContainerLegacy />;
    }
    return (
        <LocationErrorBoundary location={location}>
            <PublicShareLinkInitContainer />
        </LocationErrorBoundary>
    );
}
export const PUBLIC_SHARE_SIGNUP_MODAL_KEY = 'public-share-signup-modal';

const loadRootNode = async (url: string, password: string | undefined, isAnonymous: boolean) => {
    const drive = getDrive();
    try {
        const publicLinkClient = await drive.experimental.authPublicLink(url, password, isAnonymous);
        setPublicLinkClient(publicLinkClient);
        uploadManager.setDriveClient(publicLinkClient);
        const rootNode = await publicLinkClient.getRootNode();
        return rootNode;
    } catch (error) {
        throw error;
    }
};

/**
 * PublicShareLinkInitContainer initiate public session for shared link.
 * That is to initiate SRP handshake and ask for password if needed to
 * initiate session itself.
 */
function PublicShareLinkInitContainer() {
    const { drive, init } = useDrive();
    const { setTheme } = useTheme();
    const api = useApi();
    const [isPasswordNeeded, setIsPasswordNeeded] = useState(false);
    const [customPassword, setCustomPassword] = useState('');
    const [rootNode, setRootNode] = useState<NodeEntity>();
    const [isLoading, setIsLoading] = useState(!rootNode);
    const isPartialView = usePartialPublicView();
    const authentication = useAuthentication();
    const silentApi = <T,>(config: any) => api<T>({ ...config, silence: true });

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
        // Always delete saved public share URL when browsing a public share url
        deleteStoredUrlPassword();

        // Set default theme to Snow (white)
        setTheme(ThemeTypes.Snow);
    }, []);

    useEffect(() => {
        if (!drive) {
            return;
        }
        let cancelled = false;
        void drive.experimental
            .getPublicLinkInfo(window.location.href)
            .then(async (publicLinkInfo) => {
                if (cancelled) {
                    return;
                }
                const persistedSession = getLastActivePersistedUserSession();
                // TODO: Add user info support + move it to different file
                if (persistedSession) {
                    try {
                        // We need to silence reponse, in case the token is invalid we just want to show not logged-in page instead of have error notification
                        const resumedSession = await resumeSession({
                            api: silentApi,
                            localID: persistedSession.localID,
                        });
                        if (resumedSession) {
                            authentication.setPassword(resumedSession.keyPassword);
                            authentication.setUID(persistedSession.UID);
                            authentication.setLocalID(persistedSession.localID);
                            // TODO: Remove this hack - find proper way to set UID on api instance for authenticated requests
                            (api as any).UID = persistedSession.UID;
                            // TODO: Uncomment when implementing logged-in user support on public pages
                            // - Add address key info retrieval
                            // - Add user formatting and state management
                            // - Add user success metrics tracking
                            // In case user is logged-in we can preload default share.
                            // This will be used to get info for users actions (Rename, Delete, etc..)
                            // const addressKeyInfo = await getAddressKeyInfo(new AbortController().signal);
                            // if (addressKeyInfo) {
                            //     setUserAddressEmail(addressKeyInfo.address.Email);
                            // }
                        }
                        // const user = formatUser(resumedSession.User);
                        // setUser(user);
                        // await userSuccessMetrics.setLocalUser(
                        //     persistedSession.UID,
                        //     getMetricsUserPlan({ user, isPublicContext: true })
                        // );
                    } catch (e) {
                        // TODO: Add telemetry/logging for failed session resumes in production
                        console.warn('Cannot resume session');
                    }
                }
                if (publicLinkInfo.isCustomPasswordProtected) {
                    setIsPasswordNeeded(publicLinkInfo.isCustomPasswordProtected);
                } else {
                    const maybeNode = await loadRootNode(
                        window.location.href,
                        customPassword,
                        !authentication.getUID()
                    );
                    if (!maybeNode) {
                        return;
                    }
                    const { node } = getNodeEntity(maybeNode);
                    setRootNode(node);
                    if (!node.deprecatedShareId) {
                        return;
                    }
                }
            })
            .catch((e) => {
                handleSdkError(e);
            })
            .finally(() => {
                if (cancelled) {
                    return;
                }
                setIsLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [drive, customPassword, authentication]);

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
        <>
            {rootNode.type === NodeType.File ? (
                // TODO: Implement SharedFilePage component using new SDK architecture
                <div>Not implemented yet</div>
            ) : (
                <PublicFolderView nodeUid={rootNode.uid} folderName={rootNode.name} />
            )}
            <TransferManager deprecatedRootShareId={rootNode.deprecatedShareId} />
        </>
    );
}
