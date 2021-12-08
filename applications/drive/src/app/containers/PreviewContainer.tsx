import { useEffect, useState, useCallback, useRef } from 'react';
import { RouteComponentProps, useLocation } from 'react-router-dom';

import { FilePreview, NavigationControl, useModals } from '@proton/components';
import { LinkType } from '@proton/shared/lib/interfaces/drive/link';
import { STATUS_CODE } from '@proton/shared/lib/drive/constants';

import { DecryptedLink, useFileView } from '../store';
import useActiveShare from '../hooks/drive/useActiveShare';
import useNavigate from '../hooks/drive/useNavigate';
import { mapDecryptedLinksToChildren } from '../components/sections/helpers';
import DetailsModal from '../components/DetailsModal';
import ShareLinkModal from '../components/ShareLinkModal/ShareLinkModal';

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
    const { navigateToLink, navigateToSharedURLs, navigateToTrash, navigateToRoot } = useNavigate();
    const { setFolder } = useActiveShare();
    const [, setError] = useState();
    const { createModal } = useModals();

    const referer = new URLSearchParams(useLocation().search).get('r');
    const useNavigation = !referer?.startsWith('/shared-urls') && !referer?.startsWith('/trash');

    const { isLoading, error, link, contents, saveFile, navigation } = useFileView(shareId, linkId, useNavigation);

    useEffect(() => {
        if (link) {
            setFolder({ shareId, linkId: link.parentLinkId });
        }
    }, [shareId, link?.parentLinkId]);

    useEffect(() => {
        if (error) {
            if (error.status === STATUS_CODE.NOT_FOUND) {
                navigateToRoot();
            } else {
                setError(() => {
                    throw error;
                });
            }
        }
    }, [error]);

    const navigateToParent = useCallback(() => {
        if (referer?.startsWith('/shared-urls')) {
            navigateToSharedURLs();
            return;
        }
        if (referer?.startsWith('/trash')) {
            navigateToTrash();
            return;
        }
        if (link?.parentLinkId) {
            navigateToLink(shareId, link.parentLinkId, LinkType.FOLDER);
        }
    }, [link?.parentLinkId, shareId, referer]);

    const onOpen = useCallback(
        (linkId: string | undefined) => {
            if (linkId) {
                navigateToLink(shareId, linkId, LinkType.FILE);
            }
        },
        [shareId]
    );

    const openDetails = useCallback(() => {
        if (!link) {
            return;
        }

        const [item] = mapDecryptedLinksToChildren([link]);
        createModal(<DetailsModal shareId={shareId} item={item} />);
    }, [shareId, link]);

    const openShareOptions = useCallback(() => {
        if (!link) {
            return;
        }

        const [item] = mapDecryptedLinksToChildren([link]);
        createModal(<ShareLinkModal shareId={shareId} item={item} />);
    }, [shareId, link]);

    const rootRef = useRef<HTMLDivElement>(null);

    return (
        <FilePreview
            loading={isLoading}
            contents={contents}
            fileName={link?.name}
            mimeType={link?.mimeType}
            sharedStatus={getSharedStatus(link)}
            fileSize={link?.size}
            onClose={navigateToParent}
            onSave={saveFile}
            onDetail={openDetails}
            onShare={openShareOptions}
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
        />
    );
}
