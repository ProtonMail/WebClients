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
import { getDriveForPhotos } from '@proton/drive';
import { IcCrossBig } from '@proton/icons/icons/IcCrossBig';
import { IcInfoCircle } from '@proton/icons/icons/IcInfoCircle';
import { IcThreeDotsVertical } from '@proton/icons/icons/IcThreeDotsVertical';

import useNavigate from '../../../legacy/hooks/drive/useNavigate';
import { useSharingActions } from '../../../legacy/hooks/drive/useSharingActions';
import { useDetailsModal } from '../../../modals/DetailsModal';

import './AlbumsCard.scss';

interface SharedAlbumDropdownButtonProps {
    nodeUid: string;
}

export const SharedAlbumDropdownButton = ({ nodeUid }: SharedAlbumDropdownButtonProps) => {
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    const { detailsModal, showDetailsModal } = useDetailsModal();
    const onShowDetails = useCallback(() => {
        showDetailsModal({
            drive: getDriveForPhotos(),
            nodeUid,
        });
    }, [nodeUid, showDetailsModal]);

    const { removeMe } = useSharingActions();
    const { navigateToAlbums } = useNavigate();
    const [confirmModal, showConfirmModal] = useConfirmActionModal();
    const onLeaveAlbum = useCallback(() => {
        removeMe(showConfirmModal, getDriveForPhotos(), nodeUid, navigateToAlbums);
    }, [navigateToAlbums, nodeUid, removeMe, showConfirmModal]);

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
                            onLeaveAlbum();
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
