import { memo } from 'react';

import { useShallow } from 'zustand/react/shallow';

import { useConfirmActionModal } from '@proton/components';
import { NodeType } from '@proton/drive/index';
import { useContactEmails } from '@proton/mail/store/contactEmails/hooks';

import { AcceptOrRejectInviteCell } from '../../components/cells/AcceptOrRejectInviteCell';
import { CheckboxCell } from '../../components/cells/CheckboxCell';
import { ContextMenuCell } from '../../components/cells/ContextMenuCell';
import { EmptyCell } from '../../components/cells/EmptyCell';
import { NameCell } from '../../components/cells/NameCell';
import { SharedByCell } from '../../components/cells/SharedByCell';
import { TimeCell } from '../../components/cells/TimeCell';
import useVolumesState from '../../store/_volumes/useVolumesState';
import { dateToLegacyTimestamp } from '../../utils/sdk/legacyTime';
import { ItemType, useSharedWithMeListingStore } from '../../zustand/sections/sharedWithMeListing.store';
import { useThumbnailStore } from '../../zustand/thumbnail/thumbnail.store';
import { useInvitationsActions } from './hooks/useInvitationsActions';
import { useLegacyInvitationsActions } from './legacy/useLegacyInvitationsActions';

export type SharedWithMeRowData = {
    uid: string;
    name: string;
    type: NodeType;
    mediaType: string | undefined;
    thumbnailId: string | undefined;
    size: number | undefined;
    itemType: ItemType;
    sharedBy: string;
    sharedOn: Date | undefined;
    invitationUid: string | undefined;
    bookmarkUrl: string | undefined;
    haveSignatureIssues: boolean | undefined;
    legacy: {
        linkId: string;
        shareId: string;
        volumeId: string;
        isLocked?: boolean;
    };
};

const getSharedBy = (item: any): string => {
    if (item.itemType === ItemType.DIRECT_SHARE) {
        return item.directShare.sharedBy;
    }
    if (item.itemType === ItemType.INVITATION) {
        return item.invitation.sharedBy;
    }
    return '';
};

const getSharedOn = (item: any): Date | undefined => {
    if (item.itemType === ItemType.BOOKMARK) {
        return item.bookmark.creationTime;
    }
    if (item.itemType === ItemType.DIRECT_SHARE) {
        return item.directShare.sharedOn;
    }
    return undefined;
};

const NameCellWithThumbnail = ({
    name,
    mediaType,
    type,
    thumbnailId,
    isInvitation,
    haveSignatureIssues,
}: {
    name: string;
    mediaType: string | undefined;
    type: NodeType;
    thumbnailId: string | undefined;
    isInvitation?: boolean;
    haveSignatureIssues: boolean | undefined;
}) => {
    const thumbnail = useThumbnailStore((state) => (thumbnailId ? state.thumbnails[thumbnailId] : undefined));

    return (
        <NameCell
            name={name}
            mediaType={mediaType}
            type={type}
            thumbnailUrl={thumbnail?.sdUrl}
            isInvitation={isInvitation}
            haveSignatureIssues={haveSignatureIssues}
        />
    );
};

const SharedByCellWithInfo = ({ sharedBy, itemType }: { sharedBy: string; itemType: ItemType }) => {
    const [contactEmails] = useContactEmails();

    const contactEmail = contactEmails?.find((contactEmail) => contactEmail.Email === sharedBy);
    const displayName = sharedBy && contactEmails && contactEmail ? contactEmail.Name : sharedBy;
    return <SharedByCell displayName={displayName} isBookmark={itemType === ItemType.BOOKMARK} />;
};

const SharedOnCellWithInfo = ({ sharedOn }: { sharedOn: Date | undefined }) => {
    return sharedOn ? <TimeCell time={dateToLegacyTimestamp(sharedOn)} /> : <EmptyCell />;
};

const AcceptOrRejectCellComponent = ({
    uid,
    invitationUid,
    name,
    type,
}: {
    uid: string;
    invitationUid: string;
    name: string;
    type: NodeType;
}) => {
    const [confirmModal, showConfirmModal] = useConfirmActionModal();
    // TODO: Remove that when we will have sdk for upload
    const { setVolumeShareIds } = useVolumesState();
    const { acceptInvitation, rejectInvitation } = useInvitationsActions({ setVolumeShareIds });
    const { acceptLegacyInvitation, rejectLegacyInvitation } = useLegacyInvitationsActions();

    return (
        <>
            <AcceptOrRejectInviteCell
                onAccept={async () => {
                    if (type === NodeType.Album) {
                        await acceptLegacyInvitation(uid, invitationUid);
                    } else {
                        await acceptInvitation(uid, invitationUid);
                    }
                }}
                onReject={() => {
                    if (type === NodeType.Album) {
                        void rejectLegacyInvitation(showConfirmModal, { uid, invitationUid });
                    } else {
                        void rejectInvitation(showConfirmModal, { uid, invitationUid, name, type });
                    }
                }}
            />
            {confirmModal}
        </>
    );
};

export type MappedLegacyItem = {
    id: string;
    trashed: null;
    volumeId: string;
    parentLinkId: string;
    rootShareId: string;
    mimeType: string;
    linkId: string;
    isFile: boolean;
    name: string;
    size: number;
};

const SharedWithMeRow = memo(
    ({
        item,
        cells,
    }: {
        item: MappedLegacyItem;
        cells: React.FC<{ item: MappedLegacyItem; rowData: SharedWithMeRowData }>[];
    }) => {
        const rowData = useSharedWithMeListingStore(
            useShallow((state) => {
                const storeItem = state.getSharedWithMeItem(item.id);
                if (!storeItem) {
                    return null;
                }

                return {
                    uid: storeItem.itemType === ItemType.BOOKMARK ? storeItem.bookmark.uid : storeItem.nodeUid,
                    name: storeItem.name,
                    type: storeItem.type,
                    mediaType: storeItem.mediaType,
                    thumbnailId: storeItem.thumbnailId,
                    size: storeItem.size,
                    itemType: storeItem.itemType,
                    sharedBy: getSharedBy(storeItem),
                    sharedOn: getSharedOn(storeItem),
                    invitationUid: storeItem.itemType === ItemType.INVITATION ? storeItem.invitation.uid : undefined,
                    bookmarkUrl: storeItem.itemType === ItemType.BOOKMARK ? storeItem.bookmark.url : undefined,
                    haveSignatureIssues:
                        storeItem.itemType === ItemType.DIRECT_SHARE ? storeItem.haveSignatureIssues : undefined,
                    legacy: storeItem.legacy,
                };
            })
        );

        // If no data available, don't render the row
        if (!rowData) {
            return null;
        }

        return (
            <>
                {cells.map((CellComponent, index) => (
                    <CellComponent key={index} item={item} rowData={rowData} />
                ))}
            </>
        );
    }
);

SharedWithMeRow.displayName = 'SharedWithMeRow';

const largeScreenCellComponents: React.FC<{ item: MappedLegacyItem; rowData: SharedWithMeRowData }>[] = [
    ({ item }) => <CheckboxCell uid={item.id} isLocked={false} />,
    ({ rowData }) => (
        <NameCellWithThumbnail
            name={rowData.name}
            mediaType={rowData.mediaType}
            type={rowData.type}
            thumbnailId={rowData.thumbnailId}
            isInvitation={rowData.itemType === ItemType.INVITATION}
            haveSignatureIssues={rowData.haveSignatureIssues}
        />
    ),
    ({ rowData }) => <SharedByCellWithInfo sharedBy={rowData.sharedBy} itemType={rowData.itemType} />,
    ({ rowData }) =>
        rowData.itemType === ItemType.INVITATION && rowData.invitationUid ? (
            <AcceptOrRejectCellComponent
                uid={rowData.uid}
                invitationUid={rowData.invitationUid}
                type={rowData.type}
                name={rowData.name}
            />
        ) : (
            <SharedOnCellWithInfo sharedOn={rowData.sharedOn} />
        ),
    ({ item }) => <ContextMenuCell uid={item.id} />,
];

const smallScreenCellComponents: React.FC<{ item: MappedLegacyItem; rowData: SharedWithMeRowData }>[] = [
    ({ item }) => <CheckboxCell uid={item.id} isLocked={false} />,
    ({ rowData }) => (
        <NameCellWithThumbnail
            name={rowData.name}
            mediaType={rowData.mediaType}
            type={rowData.type}
            thumbnailId={rowData.thumbnailId}
            isInvitation={rowData.itemType === ItemType.INVITATION}
            haveSignatureIssues={rowData.haveSignatureIssues}
        />
    ),
    ({ rowData }) =>
        rowData.itemType === ItemType.INVITATION && rowData.invitationUid ? (
            <AcceptOrRejectCellComponent
                uid={rowData.uid}
                invitationUid={rowData.invitationUid}
                type={rowData.type}
                name={rowData.name}
            />
        ) : null,
    ({ item }) => <ContextMenuCell uid={item.id} />,
];

export const largeScreenCells: React.FC<{ item: MappedLegacyItem }>[] = [
    ({ item }) => <SharedWithMeRow item={item} cells={largeScreenCellComponents} />,
];

export const smallScreenCells: React.FC<{ item: MappedLegacyItem }>[] = [
    ({ item }) => <SharedWithMeRow item={item} cells={smallScreenCellComponents} />,
];
