import { classnames, TableCell, useActiveBreakpoint, FileIcon } from '@proton/components';

import useActiveShare from '../../../hooks/drive/useActiveShare';
import CopyLinkIcon from './CopyLinkIcon';
import { DriveItem } from '../Drive/Drive';
import SignatureIcon from '../../SignatureIcon';
import { getLinkIconText } from './utils';
import { TrashItem } from '../Trash/Trash';
import { SharedLinkItem } from '../SharedLinks/SharedLinks';
import { formatAccessCount } from '../../../utils/formatters';
import { Cells } from '../../FileBrowser';

const { LocationCell: LocationCellBase, SizeCell: SizeCellBase, NameCell: NameCellBase, TimeCell } = Cells;

export const NameCell = ({ item }: { item: DriveItem | SharedLinkItem | TrashItem }) => {
    const iconText = getLinkIconText({
        linkName: item.name,
        mimeType: item.mimeType,
        isFile: item.isFile,
    });

    return (
        <TableCell className="m0 flex flex-align-items-center flex-nowrap flex-item-fluid" data-testid="column-name">
            {item.cachedThumbnailUrl ? (
                <img
                    src={item.cachedThumbnailUrl}
                    alt={iconText}
                    className="file-browser-list-item--thumbnail flex-item-noshrink mr0-5"
                />
            ) : (
                <FileIcon mimeType={item.isFile ? item.mimeType : 'Folder'} alt={iconText} className="mr0-5" />
            )}
            <SignatureIcon
                signatureIssues={item.signatureIssues}
                isFile={item.isFile}
                className="mr0-5 flex-item-noshrink"
            />
            <NameCellBase name={item.name} />
        </TableCell>
    );
};

export const SizeCell = ({ item }: { item: DriveItem | TrashItem }) => {
    const { isDesktop } = useActiveBreakpoint();
    return (
        <TableCell className={classnames(['m0', isDesktop ? 'w10' : 'w15'])} data-testid="column-size">
            {item.isFile ? <SizeCellBase size={item.size} /> : '-'}
        </TableCell>
    );
};

export const ModifiedCell = ({ item }: { item: DriveItem }) => {
    return (
        <TableCell className="m0 w15" data-testid="column-modified">
            <TimeCell time={item.fileModifyTime} />
        </TableCell>
    );
};

export const DeletedCell = ({ item }: { item: TrashItem }) => {
    return (
        <TableCell className="m0 w25" data-testid="column-trashed">
            <TimeCell time={item.trashed || item.fileModifyTime} />
        </TableCell>
    );
};

export const CreatedCell = ({ item }: { item: TrashItem }) => {
    return (
        <TableCell className="m0 w15" data-testid="column-share-created">
            {item.shareUrl?.createTime && <TimeCell time={item.shareUrl.createTime} />}
        </TableCell>
    );
};

export const LocationCell = ({ item }: { item: TrashItem }) => {
    const { isDesktop } = useActiveBreakpoint();
    const { activeShareId } = useActiveShare();
    return (
        <TableCell className={classnames(['m0', isDesktop ? 'w20' : 'w25'])} data-testid="column-location">
            <LocationCellBase shareId={activeShareId} parentLinkId={item.parentLinkId} />
        </TableCell>
    );
};

export const AccessCountCell = ({ item }: { item: TrashItem }) => {
    return (
        <TableCell className="m0 w15" data-testid="column-num-accesses">
            {formatAccessCount(item.shareUrl?.numAccesses)}
        </TableCell>
    );
};

export const ExpirationCell = ({ item }: { item: TrashItem }) => {
    return (
        <TableCell className="m0 w20" data-testid="column-num-accesses">
            {formatAccessCount(item.shareUrl?.numAccesses)}
        </TableCell>
    );
};

export const ShareOptionsCell = ({ item }: { item: DriveItem }) => {
    const { activeShareId } = useActiveShare();

    return (
        <TableCell
            className="m0 file-browser-list--icon-column flex flex-align-items-center"
            data-testid="column-share-options"
        >
            {item.shareUrl ? (
                <CopyLinkIcon
                    shareId={activeShareId}
                    linkId={item.id}
                    isExpired={Boolean(item.shareUrl?.isExpired)}
                    trashed={item.trashed}
                />
            ) : null}
        </TableCell>
    );
};
