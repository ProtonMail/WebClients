import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom-v5-compat';

import { getUnixTime } from 'date-fns';

import { useAuthentication, useTheme } from '@proton/components';
import { type NodeEntity, NodeType, getDrive, splitNodeUid, useDrive } from '@proton/drive';
import { uploadManager } from '@proton/drive/modules/upload';
import { handleDocsCustomPassword } from '@proton/shared/lib/drive/sharing/publicDocsSharing';
import { isProtonDocsDocument, isProtonDocsSpreadsheet } from '@proton/shared/lib/helpers/mimetype';
import { getNewWindow } from '@proton/shared/lib/helpers/window';
import { LinkType } from '@proton/shared/lib/interfaces/drive/link';
import { ThemeTypes } from '@proton/shared/lib/themes/constants';
import useFlag from '@proton/unleash/useFlag';

import { ErrorPage, LoadingPage, PasswordPage, SharedFilePage, SharedFolderPage } from '../components/SharedPage';
import { useUpsellFloatingModal } from '../components/modals/UpsellFloatingModal';
import config from '../config';
import usePublicToken from '../hooks/drive/usePublicToken';
import { usePartialPublicView } from '../hooks/util/usePartialPublicView';
import { logging } from '../modules/logging';
import { setPublicLinkClient } from '../sections/publicPage/publicLinkClient';
import type { DecryptedLink } from '../store';
import { PublicDriveProvider, useBookmarksPublicView, useDownload } from '../store';
import { useDriveWebShareURLSignupModal } from '../store/_bookmarks/useDriveWebShareURLSignupModal';
import { useDriveDocsPublicSharingFF, useOpenDocument } from '../store/_documents';
import { handleSdkError } from '../utils/errorHandling/useSdkErrorHandler';
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
            <PublicDriveProvider>
                <PublicShareLinkInitContainer />
            </PublicDriveProvider>
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
    const { clearDownloads } = useDownload();
    const { token, urlPassword } = usePublicToken();
    const { drive, init } = useDrive();
    const { setTheme } = useTheme();
    const [isPasswordNeeded, setIsPasswordNeeded] = useState(false);
    const [isLegacy, setIsLegacy] = useState(false);
    const [customPassword, setCustomPassword] = useState('');
    const bookmarksFeatureDisabled = useFlag('DriveShareURLBookmarksDisabled');
    const isDriveWebShareUrlSignupModalEnabled = useDriveWebShareURLSignupModal();
    const [rootNode, setRootNode] = useState<NodeEntity>();
    const [isLoading, setIsLoading] = useState(!rootNode);
    const [link, setLink] = useState<DecryptedLink>();
    const [error, setError] = useState<unknown | Error>();
    const bookmarksPublicView = useBookmarksPublicView({ customPassword });
    const [renderUpsellFloatingModal] = useUpsellFloatingModal();
    const isPartialView = usePartialPublicView();
    const authentication = useAuthentication();

    const { isDocsPublicSharingEnabled } = useDriveDocsPublicSharingFF();
    const { openDocumentWindow } = useOpenDocument();

    // const showErrorPage = showLoadingPage === false && link === undefined;
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

    useEffect(() => {
        if (!drive) {
            init({
                appName: config.APP_NAME,
                appVersion: config.APP_VERSION,
                logging,
            });
        }
    }, [drive, init]);

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
        if (!drive) {
            return;
        }
        let cancelled = false;
        void drive.experimental
            .getPublicLinkInfo(window.location.href)
            .then(async (linkInfo) => {
                if (cancelled) {
                    return;
                }
                setIsLegacy(linkInfo.isLegacy);
                if (linkInfo.isCustomPasswordProtected) {
                    setIsPasswordNeeded(linkInfo.isCustomPasswordProtected);
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
                    // TODO: Remove that in next ticket with page implementation ticket
                    setLink({
                        encryptedName: node.name,
                        fileModifyTime: node.activeRevision?.claimedModificationTime
                            ? getUnixTime(node.activeRevision.claimedModificationTime)
                            : 0,
                        rootShareId: node.deprecatedShareId,
                        volumeId: splitNodeUid(node.uid).volumeId,
                        hasThumbnail: false,
                        linkId: splitNodeUid(node.uid).nodeId,
                        parentLinkId: node.parentUid ? splitNodeUid(node.parentUid).nodeId : '',
                        type: node.type === NodeType.File ? LinkType.FILE : LinkType.FOLDER,
                        isFile: node.type === NodeType.File,
                        name: node.name,
                        mimeType: node.mediaType || '',
                        hash: node.activeRevision?.claimedDigests?.sha1 || '',
                        size: node.activeRevision?.storageSize || 0,
                        createTime: getUnixTime(node.creationTime),

                        metaDataModifyTime: node.activeRevision?.claimedModificationTime
                            ? getUnixTime(node.activeRevision.claimedModificationTime)
                            : 0,
                        trashed: null,
                    });
                }
            })
            .catch((e) => {
                handleSdkError(e);
                setError(e);
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
    }, [drive, customPassword]);

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

    if (!rootNode || !link) {
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
            {rootNode.type === NodeType.File ? <SharedFilePage {...props} /> : <SharedFolderPage {...props} />}
            {!bookmarksFeatureDisabled && isDriveWebShareUrlSignupModalEnabled ? null : renderUpsellFloatingModal}
        </>
    );
}
