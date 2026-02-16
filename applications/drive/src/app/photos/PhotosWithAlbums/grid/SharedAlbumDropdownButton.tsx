import { useCallback } from 'react';

import { c } from 'ttag';

import {
    Dropdown,
    DropdownButton,
    DropdownMenu,
    DropdownMenuButton,
    useConfirmActionModal,
    usePopperAnchor,
} from '@proton/components';
import { generateNodeUid, getDriveForPhotos } from '@proton/drive';
import { IcCrossBig } from '@proton/icons/icons/IcCrossBig';
import { IcInfoCircle } from '@proton/icons/icons/IcInfoCircle';
import { IcThreeDotsVertical } from '@proton/icons/icons/IcThreeDotsVertical';

import useNavigate from '../../../hooks/drive/useNavigate';
import { useDetailsModal } from '../../../modals/DetailsModal';
import { useSharedWithMeActions } from '../../../store';
import { usePhotosWithAlbumsView } from '../../PhotosStore/usePhotosWithAlbumView';

import './AlbumsCard.scss';

interface SharedAlbumDropdownButtonProps {
    volumeId: string;
    linkId: string;
    shareId: string;
}

export const SharedAlbumDropdownButton = ({ volumeId, linkId, shareId }: SharedAlbumDropdownButtonProps) => {
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    const { detailsModal, showDetailsModal } = useDetailsModal();
    const onShowDetails = useCallback(() => {
        if (!shareId) {
            return;
        }
        showDetailsModal({
            drive: getDriveForPhotos(),
            nodeUid: generateNodeUid(volumeId, linkId),
        });
    }, [linkId, shareId]);

    const { removeMe } = useSharedWithMeActions();
    const { refreshSharedWithMeAlbums } = usePhotosWithAlbumsView();
    const { navigateToAlbums } = useNavigate();
    const [confirmModal, showConfirmModal] = useConfirmActionModal();
    const onLeaveAlbum = useCallback(async () => {
        if (!shareId) {
            return;
        }
        const abortSignal = new AbortController().signal;
        removeMe(abortSignal, showConfirmModal, shareId, async () => {
            // Hack: there might be race condition - after deleting the membership
            // the album might be still returned by the API but fails to be loaded
            // when requesting additional resources. In such a case a second run
            // should fix the problem.
            // If the album is returned and decrypted successfuly, page refresh or
            // events later will fix that the album is still being displayed.
            try {
                await refreshSharedWithMeAlbums(abortSignal);
            } catch (e) {
                console.warn(e);
                await refreshSharedWithMeAlbums(abortSignal);
            }
            navigateToAlbums();
        });
    }, [navigateToAlbums, refreshSharedWithMeAlbums, removeMe]);

    return (
        <>
            {detailsModal}
            {confirmModal}
            <DropdownButton
                shape="ghost"
                color="weak"
                ref={anchorRef}
                isOpen={isOpen}
                onClick={(e) => {
                    e.stopPropagation();
                    toggle();
                }}
                icon
                className="inline-flex flex-nowrap flex-row items-center relative z-up border-none"
            >
                <IcThreeDotsVertical alt={c('Action').t`More`} />
            </DropdownButton>
            <Dropdown isOpen={isOpen} anchorRef={anchorRef} onClose={close}>
                <DropdownMenu>
                    <DropdownMenuButton
                        onClick={(e) => {
                            e.stopPropagation();
                            onShowDetails();
                        }}
                        className="text-left flex items-center flex-nowrap"
                    >
                        <IcInfoCircle className="mr-2" />
                        {c('Action').t`Details`}
                    </DropdownMenuButton>
                    <DropdownMenuButton
                        onClick={(e) => {
                            e.stopPropagation();
                            void onLeaveAlbum();
                        }}
                        className="text-left flex items-center flex-nowrap"
                    >
                        <IcCrossBig className="mr-2" />
                        {c('Action').t`Leave album`}
                    </DropdownMenuButton>
                </DropdownMenu>
            </Dropdown>
        </>
    );
};
