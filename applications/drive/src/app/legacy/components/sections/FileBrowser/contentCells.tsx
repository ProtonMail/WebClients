import { c } from 'ttag';

import { FileIcon, TableCell, useActiveBreakpoint } from '@proton/components';
import clsx from '@proton/utils/clsx';

import { useLinkPath } from '../../../../legacy/store';
import { Cells } from '../../FileBrowser';
import { DeprecatedSignatureIcon as SignatureIcon } from '../../SignatureIcon';
import type { DriveItem, SharedLinkItem, SharedWithMeItem, TrashItem } from '../interface';
import { getLinkIconText } from './utils';

const { LocationCell: LocationCellBase, SizeCell: SizeCellBase, NameCell: NameCellBase, TimeCell } = Cells;

export const NameCell = ({ item }: { item: DriveItem | SharedLinkItem | SharedWithMeItem | TrashItem }) => {
    const iconText = getLinkIconText({
        linkName: item.name,
        mimeType: item.mimeType,
        isFile: item.isFile,
    });

    return (
        <TableCell className="m-0 flex items-center flex-nowrap flex-1" data-testid="column-name">
            {item.albumProperties && (
                <FileIcon mimeType="Album" alt={c('Label').t`Album`} className="file-browser-list-item--icon mr-2" />
            )}
            {item.cachedThumbnailUrl && !item.albumProperties && (
                <img
                    src={item.cachedThumbnailUrl}
                    alt={iconText}
                    className="file-browser-list-item--thumbnail shrink-0 mr-2"
                />
            )}
            {!item.cachedThumbnailUrl && !item.albumProperties && (
                <FileIcon
                    mimeType={item.isFile ? item.mimeType : item.mimeType || 'Folder'}
                    alt={iconText}
                    className="file-browser-list-item--icon mr-2"
                />
            )}
            <SignatureIcon
                signatureIssues={item.signatureIssues}
                isAnonymous={item.isAnonymous}
                isFile={item.isFile}
                mimeType={item.mimeType}
                className="mr-2 shrink-0"
                haveParentAccess={!!item.parentLinkId}
            />
            <NameCellBase name={item.name} />
        </TableCell>
    );
};

export const ModifiedCell = ({ item }: { item: { fileModifyTime: number } }) => {
    return (
        <TableCell className="flex items-center m-0 w-1/6" data-testid="column-modified">
            <TimeCell time={item.fileModifyTime} />
        </TableCell>
    );
};

export function SizeCell({ item }: { item: DriveItem | TrashItem }) {
    const { viewportWidth } = useActiveBreakpoint();
    return (
        <TableCell
            className={clsx(['flex items-center m-0', viewportWidth['>=large'] ? 'w-1/10' : 'w-1/6'])}
            data-testid="column-size"
        >
            {item.isFile ? <SizeCellBase size={item.size} /> : '-'}
        </TableCell>
    );
}

export const LocationCell = ({ item }: { item: TrashItem | SharedLinkItem }) => {
    const { viewportWidth } = useActiveBreakpoint();
    const { getPath } = useLinkPath();
    const shareId = item.rootShareId;

    return (
        <TableCell
            className={`flex items-center ${clsx(['m-0', viewportWidth['>=large'] ? 'w-1/5' : 'w-1/4'])}`}
            data-testid="column-location"
        >
            <LocationCellBase shareId={shareId} parentLinkId={item.parentLinkId} getPath={getPath} />
        </TableCell>
    );
};

