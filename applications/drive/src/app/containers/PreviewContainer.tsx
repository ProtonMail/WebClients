import { useCallback, useEffect, useMemo, useRef } from 'react';
import { RouteComponentProps, useLocation } from 'react-router-dom';

import { c } from 'ttag';

import { FilePreview, NavigationControl } from '@proton/components';
import { HTTP_STATUS_CODE } from '@proton/shared/lib/constants';
import { RESPONSE_CODE } from '@proton/shared/lib/drive/constants';

import { SignatureAlertBody } from '../components/SignatureAlert';
import SignatureIcon from '../components/SignatureIcon';
import { useDetailsModal } from '../components/modals/DetailsModal';
import { useLinkSharingModal } from '../components/modals/ShareLinkModal/ShareLinkModal';
import useIsEditEnabled from '../components/sections/useIsEditEnabled';
import useActiveShare from '../hooks/drive/useActiveShare';
import useNavigate from '../hooks/drive/useNavigate';
import { DecryptedLink, useActions, useFileView } from '../store';
// TODO: ideally not use here
import useSearchResults from '../store/_search/useSearchResults';

const getSharedStatus = (link?: DecryptedLink) => {
    if (!link?.isShared) {
        return '';
    }
    if (link?.shareUrl?.isExpired || link?.trashed) {
        return 'inactive';
    }
    return 'shared';
};

export default function PreviewContainer({ match }: RouteComponentProps<{ shareId: string; linkId: string }>) {
    const { shareId, linkId } = match.params;
    const {
        navigateToLink,
        navigateToSharedURLs,
        navigateToSharedWithMe,
        navigateToTrash,
        navigateToRoot,
        navigateToSearch,
    } = useNavigate();
    const { setFolder } = useActiveShare();
    const [detailsModal, showDetailsModal] = useDetailsModal();
    const [linkSharingModal, showLinkSharingModal] = useLinkSharingModal();
    const { query: lastQuery } = useSearchResults();
    const { saveFile } = useActions();

    const isEditEnabled = useIsEditEnabled();
    const referer = new URLSearchParams(useLocation().search).get('r');
    const useNavigation =
        !referer?.startsWith('/shared-with-me') &&
        !referer?.startsWith('/shared-urls') &&
        !referer?.startsWith('/trash') &&
        !referer?.startsWith('/search');

    const { isLinkLoading, isContentLoading, error, link, contents, contentsMimeType, downloadFile, navigation } =
        useFileView(shareId, linkId, useNavigation);

    // If the link is not type of file, probably user modified the URL.
    useEffect(() => {
        if (link && !link.isFile) {
            navigateToLink(shareId, linkId, false);
        }
    }, [link?.isFile]);

    useEffect(() => {
        if (link && !referer?.startsWith('/shared-with-me')) {
            setFolder({ shareId, linkId: link.parentLinkId });
        }
    }, [shareId, link?.parentLinkId]);

    useEffect(() => {
        if (!error) {
            return;
        }
        if (
            // Block not found (storage response).
            error.status === HTTP_STATUS_CODE.NOT_FOUND ||
            // Meta data not found (API response).
            error.data?.Code === RESPONSE_CODE.NOT_FOUND ||
            error.data?.Code === RESPONSE_CODE.INVALID_ID
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
            navigateToSharedURLs();
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
            <SignatureIcon isFile={link.isFile} signatureIssues={link.signatureIssues} className="ml-2 color-danger" />
        );
    }, [link]);

    const signatureConfirmation = useMemo(() => {
        if (!link?.signatureIssues?.blocks) {
            return;
        }

        return (
            <SignatureAlertBody
                signatureIssues={link.signatureIssues}
                signatureAddress={link.signatureAddress}
                isFile={link.isFile}
                name={link.name}
            />
        );
    }, [link]);

    const handleSaveFile = useCallback(
        (content: Uint8Array[]) => {
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
                onSave={isEditEnabled ? handleSaveFile : undefined}
                onDetails={() => showDetailsModal({ shareId, linkId })}
                onShare={isLinkLoading || !!link?.trashed ? undefined : () => showLinkSharingModal({ shareId, linkId })}
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
            />
            {detailsModal}
            {linkSharingModal}
        </>
    );
}
