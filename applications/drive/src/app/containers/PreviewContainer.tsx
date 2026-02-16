import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom-v5-compat';

import { c } from 'ttag';

import { FilePreview, Loader, NavigationControl } from '@proton/components';
import { generateNodeUid, getDrive, splitNodeUid } from '@proton/drive';
import { HTTP_STATUS_CODE } from '@proton/shared/lib/constants';
import { getCanAdmin } from '@proton/shared/lib/drive/permissions';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';

import { SignatureAlertBody } from '../components/SignatureAlert';
import { DeprecatedSignatureIcon as SignatureIcon } from '../components/SignatureIcon';
import { useDetailsModal } from '../components/modals/DetailsModal';
import useIsEditEnabled from '../components/sections/useIsEditEnabled';
import { useFlagsDriveSDKPreview } from '../flags/useFlagsDriveSDKPreview';
import { useFlagsDriveSheet } from '../flags/useFlagsDriveSheet';
import { useActiveShare } from '../hooks/drive/useActiveShare';
import useDriveNavigation from '../hooks/drive/useNavigate';
import { useSharingModal } from '../modals/SharingModal/SharingModal';
import { Preview } from '../modals/preview';
import { useActions, useFileView } from '../store';
import { useOpenInDocs } from '../store/_documents';
// TODO: ideally not use here
import useSearchResults from '../store/_search/useSearchResults';
import { getSharedStatus } from '../utils/share';

interface PreviewContainerProps {
    shareId: string;
    nodeUid: string | undefined;
}

export default function PreviewContainer(props: PreviewContainerProps | undefined) {
    const useSDK = useFlagsDriveSDKPreview();
    return useSDK && props ? (
        <PreviewContainerSDK shareId={props.shareId} nodeUid={props.nodeUid} />
    ) : (
        <PreviewContainerDeprecated />
    );
}

function PreviewContainerSDK({ shareId, nodeUid }: PreviewContainerProps) {
    const [parentFolderId, setParentFolderId] = useState<string | undefined>();

    const { navigateToLink, navigateToRoot } = useDriveNavigation();
    const navigate = useNavigate();

    // Using Drive client as a context as only normal files have a file URL.
    const drive = getDrive();

    useEffect(() => {
        if (!nodeUid) {
            return;
        }
        void drive.getNode(nodeUid).then((node) => {
            const parentFolderUid = node.ok ? node.value.parentUid : node.error.parentUid;
            if (parentFolderUid) {
                const { nodeId } = splitNodeUid(parentFolderUid);
                setParentFolderId(nodeId);
            }
        });
    }, [drive, nodeUid]);

    if (!nodeUid) {
        return <Loader size="medium" className="absolute inset-center" />;
    }

    return (
        <Preview
            drive={drive}
            deprecatedContextShareId={shareId}
            nodeUid={nodeUid}
            onClose={() => {
                const referer = new URLSearchParams(window.location.search).get('r');
                if (referer) {
                    navigate(referer);
                } else if (parentFolderId) {
                    navigateToLink(shareId, parentFolderId, false);
                } else {
                    navigateToRoot();
                }
            }}
        />
    );
}

function PreviewContainerDeprecated() {
    const { shareId, linkId } = useParams<{ shareId: string; linkId: string }>() as { shareId: string; linkId: string };
    const {
        navigateToLink,
        navigateToSharedByMe,
        navigateToSharedWithMe,
        navigateToTrash,
        navigateToRoot,
        navigateToNoAccess,
        navigateToSearch,
    } = useDriveNavigation();
    const { setFolder } = useActiveShare();
    const [detailsModal, showDetailsModal] = useDetailsModal();
    const { sharingModal, showSharingModal } = useSharingModal();
    const { query: lastQuery } = useSearchResults();
    const { saveFile } = useActions();

    const isEditEnabled = useIsEditEnabled();

    const urlParams = new URLSearchParams(useLocation().search);
    const isShareAction = urlParams.has('share');
    const referer = urlParams.get('r');
    const useNavigation =
        !referer?.startsWith('/shared-with-me') &&
        !referer?.startsWith('/shared-urls') &&
        !referer?.startsWith('/trash') &&
        !referer?.startsWith('/search');

    const {
        permissions,
        isLinkLoading,
        isContentLoading,
        error,
        link,
        contents,
        contentsMimeType,
        downloadFile,
        navigation,
        videoStreaming,
    } = useFileView(shareId, linkId, useNavigation);

    const openInDocs = useOpenInDocs(link);

    const sheetsEnabled = useFlagsDriveSheet();

    const isAdmin = useMemo(() => getCanAdmin(permissions), [permissions]);

    // Open sharing modal through URL parameter - needed for Proton Docs
    useEffect(() => {
        if (isShareAction && link) {
            showSharingModal({ nodeUid: generateNodeUid(link.volumeId, linkId) });
        }
    }, []);

    // If the link is not type of file, probably user modified the URL.
    useEffect(() => {
        if (link && !link.isFile) {
            navigateToLink(shareId, linkId, false);
        }
    }, [link?.isFile]);

    useEffect(() => {
        if (link && !referer?.startsWith('/shared-with-me')) {
            setFolder({ volumeId: link.volumeId, shareId, linkId: link.parentLinkId });
        }
    }, [shareId, link?.parentLinkId]);

    useEffect(() => {
        if (!error) {
            return;
        }
        if (error.data?.Code === API_CUSTOM_ERROR_CODES.NOT_FOUND) {
            navigateToNoAccess();
        } else if (
            // Block not found (storage response).
            error.status === HTTP_STATUS_CODE.NOT_FOUND ||
            error.data?.Code === API_CUSTOM_ERROR_CODES.INVALID_ID
        ) {
            navigateToRoot();
        }
    }, [error]);

    const navigateToParent = useCallback(() => {
        if (referer?.startsWith('/shared-with-me')) {
            navigateToSharedWithMe();
            return;
        }
        if (referer?.startsWith('/shared-urls')) {
            navigateToSharedByMe();
            return;
        }
        if (referer?.startsWith('/trash')) {
            navigateToTrash();
            return;
        }
        if (referer?.startsWith('/search')) {
            if (lastQuery) {
                navigateToSearch(lastQuery);
                return;
            }
        }
        if (link?.parentLinkId) {
            navigateToLink(shareId, link.parentLinkId, false);
        }
    }, [link?.parentLinkId, shareId, referer]);

    const onOpen = useCallback(
        (linkId: string | undefined) => {
            if (linkId) {
                navigateToLink(shareId, linkId, true);
            }
        },
        [shareId]
    );

    const signatureStatus = useMemo(() => {
        if (!link) {
            return;
        }

        return (
            <SignatureIcon
                isFile={link.isFile}
                mimeType={link.mimeType}
                signatureIssues={link.signatureIssues}
                isAnonymous={link.isAnonymous}
                haveParentAccess={!!link.parentLinkId}
                className="ml-2 color-danger"
            />
        );
    }, [link]);

    const signatureConfirmation = useMemo(() => {
        if (!link?.signatureIssues?.blocks) {
            return;
        }

        return (
            <SignatureAlertBody
                signatureIssues={link.signatureIssues}
                signatureEmail={link.signatureEmail}
                isFile={link.isFile}
                name={link.name}
            />
        );
    }, [link]);

    const handleSaveFile = useCallback(
        (content: Uint8Array<ArrayBuffer>[]) => {
            if (!link) {
                return Promise.reject('missing link');
            }

            return saveFile(shareId, link.parentLinkId, link.name, link.mimeType, content);
        },
        [shareId, link?.name, link?.parentLinkId]
    );

    const rootRef = useRef<HTMLDivElement>(null);

    return (
        <>
            <FilePreview
                isMetaLoading={isLinkLoading}
                isLoading={isContentLoading}
                error={error ? error.message || error.toString?.() || c('Info').t`Unknown error` : undefined}
                contents={contents}
                fileName={link?.name}
                mimeType={contentsMimeType}
                sharedStatus={getSharedStatus(link)}
                fileSize={link?.size}
                onClose={navigateToParent}
                onDownload={downloadFile}
                videoStreaming={videoStreaming}
                onSave={isEditEnabled ? handleSaveFile : undefined}
                onDetails={
                    !link
                        ? undefined
                        : () => showDetailsModal({ drive: getDrive(), volumeId: link.volumeId, shareId, linkId })
                }
                onShare={
                    !isAdmin || isLinkLoading || !link || !!link?.trashed
                        ? undefined
                        : () => showSharingModal({ nodeUid: generateNodeUid(link.volumeId, linkId) })
                }
                onOpenInDocs={
                    openInDocs.canOpen
                        ? () => {
                              void openInDocs.openDocument({ link: { shareId, linkId } });
                          }
                        : undefined
                }
                imgThumbnailUrl={link?.cachedThumbnailUrl}
                ref={rootRef}
                navigationControls={
                    link &&
                    navigation && (
                        <NavigationControl
                            current={navigation.current}
                            total={navigation.total}
                            rootRef={rootRef}
                            onPrev={() => onOpen?.(navigation.prevLinkId)}
                            onNext={() => onOpen?.(navigation.nextLinkId)}
                        />
                    )
                }
                signatureStatus={signatureStatus}
                signatureConfirmation={signatureConfirmation}
                sheetsEnabled={sheetsEnabled}
            />
            {detailsModal}
            {sharingModal}
        </>
    );
}
