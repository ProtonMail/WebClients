import { memo } from 'react';

import { useShallow } from 'zustand/react/shallow';

import type { NodeType } from '@proton/drive/index';

import { AccessCountCell } from '../../components/cells/AccessCountCell';
import { CheckboxCell } from '../../components/cells/CheckboxCell';
import { ContextMenuCell } from '../../components/cells/ContextMenuCell';
import { EmptyCell } from '../../components/cells/EmptyCell';
import { ExpirationCell } from '../../components/cells/ExpirationCell';
import { LocationCell } from '../../components/cells/LocationCell';
import { NameCell } from '../../components/cells/NameCell';
import { TimeCell } from '../../components/cells/TimeCell';
import { dateToLegacyTimestamp } from '../../utils/sdk/legacyTime';
import { useThumbnailStore } from '../../zustand/thumbnail/thumbnail.store';
import { type SharedByMeItem, useSharedByMeStore } from './useSharedByMe.store';

const NameCellWithThumbnail = ({
    name,
    mediaType,
    type,
    thumbnailId,
    haveSignatureIssues,
}: {
    name: string;
    mediaType: string | undefined;
    type: NodeType;
    thumbnailId: string | undefined;
    haveSignatureIssues: boolean | undefined;
}) => {
    const thumbnail = useThumbnailStore((state) => (thumbnailId ? state.thumbnails[thumbnailId] : undefined));

    return (
        <NameCell
            name={name}
            mediaType={mediaType}
            type={type}
            thumbnailUrl={thumbnail?.sdUrl}
            haveSignatureIssues={haveSignatureIssues}
        />
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
    metaDataModifyTime: number;
    fileModifyTime: number;
};

const SharedByMeRow = memo(
    ({
        item,
        cells,
    }: {
        item: MappedLegacyItem;
        cells: React.FC<{ item: MappedLegacyItem; rowData: SharedByMeItem }>[];
    }) => {
        const rowData = useSharedByMeStore(useShallow((state) => state.getSharedByMeItem(item.id)));

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

SharedByMeRow.displayName = 'SharedByMeRow';

const largeScreenCellComponents: React.FC<{ item: MappedLegacyItem; rowData: SharedByMeItem }>[] = [
    ({ item }) => <CheckboxCell uid={item.id} isLocked={false} />,
    ({ rowData }) => (
        <NameCellWithThumbnail
            name={rowData.name}
            mediaType={rowData.mediaType}
            type={rowData.type}
            thumbnailId={rowData.thumbnailId}
            haveSignatureIssues={rowData.haveSignatureIssues}
        />
    ),
    ({ rowData }) => (rowData.location ? <LocationCell location={rowData.location} /> : <EmptyCell />),
    ({ rowData }) =>
        rowData.creationTime ? <TimeCell time={dateToLegacyTimestamp(rowData.creationTime)} /> : <EmptyCell />,
    ({ rowData }) =>
        rowData.publicLink?.numberOfInitializedDownloads !== undefined ? (
            <AccessCountCell numberOfInitializedDownloads={rowData.publicLink.numberOfInitializedDownloads} />
        ) : (
            <EmptyCell />
        ),
    ({ rowData }) => <ExpirationCell expirationTime={rowData.publicLink?.expirationTime} />,
    ({ item }) => <ContextMenuCell uid={item.id} />,
];

const smallScreenCellComponents: React.FC<{ item: MappedLegacyItem; rowData: SharedByMeItem }>[] = [
    ({ item }) => <CheckboxCell uid={item.id} isLocked={false} />,
    ({ rowData }) => (
        <NameCellWithThumbnail
            name={rowData.name}
            mediaType={rowData.mediaType}
            type={rowData.type}
            thumbnailId={rowData.thumbnailId}
            haveSignatureIssues={rowData.haveSignatureIssues}
        />
    ),
    ({ rowData }) => (rowData.location ? <LocationCell location={rowData.location} /> : <EmptyCell />),
    ({ rowData }) => <ExpirationCell expirationTime={rowData.publicLink?.expirationTime} />,
    ({ item }) => <ContextMenuCell uid={item.id} />,
];

export const largeScreenCells: React.FC<{ item: MappedLegacyItem }>[] = [
    ({ item }) => <SharedByMeRow item={item} cells={largeScreenCellComponents} />,
];

export const smallScreenCells: React.FC<{ item: MappedLegacyItem }>[] = [
    ({ item }) => <SharedByMeRow item={item} cells={smallScreenCellComponents} />,
];
