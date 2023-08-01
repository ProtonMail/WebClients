import { c } from 'ttag';

import { FileIcon, Icon, TableCell, useActiveBreakpoint } from '@proton/components';
import clsx from '@proton/utils/clsx';

import useActiveShare from '../../../hooks/drive/useActiveShare';
import { formatAccessCount } from '../../../utils/formatters';
import { Cells } from '../../FileBrowser';
import SignatureIcon from '../../SignatureIcon';
import { DeviceItem } from '../Devices/Devices';
import { DriveItem } from '../Drive/Drive';
import { SharedLinkItem } from '../SharedLinks/SharedLinks';
import { TrashItem } from '../Trash/Trash';
import CopyLinkIcon from './CopyLinkIcon';
import { getDeviceIconText, getLinkIconText } from './utils';

const { LocationCell: LocationCellBase, SizeCell: SizeCellBase, NameCell: NameCellBase, TimeCell } = Cells;

export const NameCell = ({ item }: { item: DriveItem | SharedLinkItem | TrashItem }) => {
    const iconText = getLinkIconText({
        linkName: item.name,
        mimeType: item.mimeType,
        isFile: item.isFile,
    });

    return (
        <TableCell className="m-0 flex flex-align-items-center flex-nowrap flex-item-fluid" data-testid="column-name">
            {item.cachedThumbnailUrl ? (
                <img
                    src={item.cachedThumbnailUrl}
                    alt={iconText}
                    className="file-browser-list-item--thumbnail flex-item-noshrink mr-2"
                />
            ) : (
                <FileIcon mimeType={item.isFile ? item.mimeType : 'Folder'} alt={iconText} className="mr-2" />
            )}
            <SignatureIcon
                signatureIssues={item.signatureIssues}
                isFile={item.isFile}
                className="mr-2 flex-item-noshrink"
            />
            <NameCellBase name={item.name} />
        </TableCell>
    );
};

export const DeviceNameCell = ({ item }: { item: DeviceItem }) => {
    const iconText = getDeviceIconText(item.name);

    return (
        <TableCell
            className="m-0 flex flex-align-items-center flex-nowrap flex-item-fluid filebrowser-list-device-name-cell"
            data-testid="column-name"
        >
            <Icon name="tv" alt={iconText} className="mr-2" />
            <NameCellBase name={item.name} />
        </TableCell>
    );
};

export const ModifiedCell = ({ item }: { item: DriveItem }) => {
    return (
        <TableCell className="flex flex-align-items-center m-0 w15" data-testid="column-modified">
            {item.corruptedLink ? '-' : <TimeCell time={item.fileModifyTime} />}
        </TableCell>
    );
};

export const ModifiedCellDevice = ({ item }: { item: DeviceItem }) => {
    return (
        <TableCell className="flex flex-align-items-center m-0 w15" data-testid="column-modified">
            <TimeCell time={item.modificationTime} />
        </TableCell>
    );
};

export function SizeCell({ item }: { item: DriveItem | TrashItem }) {
    const { isDesktop } = useActiveBreakpoint();
    return (
        <TableCell
            className={clsx(['flex flex-align-items-center m-0', isDesktop ? 'w10' : 'w15'])}
            data-testid="column-size"
        >
            {item.isFile ? <SizeCellBase size={item.size} /> : '-'}
        </TableCell>
    );
}

export const DeletedCell = ({ item }: { item: TrashItem }) => {
    return (
        <TableCell className="m-0 w25" data-testid="column-trashed">
            <TimeCell time={item.trashed || item.fileModifyTime} />
        </TableCell>
    );
};

export const CreatedCell = ({ item }: { item: TrashItem }) => {
    return (
        <TableCell className="m-0 w15" data-testid="column-share-created">
            {item.shareUrl?.createTime && <TimeCell time={item.shareUrl.createTime} />}
        </TableCell>
    );
};

export const LocationCell = ({ item }: { item: TrashItem | SharedLinkItem }) => {
    const { isDesktop } = useActiveBreakpoint();
    const shareId = item.rootShareId;

    return (
        <TableCell className={clsx(['m-0', isDesktop ? 'w20' : 'w25'])} data-testid="column-location">
            <LocationCellBase shareId={shareId} parentLinkId={item.parentLinkId} />
        </TableCell>
    );
};

export const AccessCountCell = ({ item }: { item: TrashItem }) => {
    return (
        <TableCell className="m-0 w15" data-testid="column-num-accesses">
            {formatAccessCount(item.shareUrl?.numAccesses)}
        </TableCell>
    );
};

export const ExpirationCell = ({ item }: { item: TrashItem }) => {
    const { isDesktop } = useActiveBreakpoint();

    const expiredPart = isDesktop ? (
        <span className="ml-1">{c('Label').t`(Expired)`}</span>
    ) : (
        <span>{c('Label').t`Expired`}</span>
    );

    let expiration;
    if (item.shareUrl) {
        expiration = item.shareUrl.expireTime ? (
            <div className="flex flex-nowrap">
                {(isDesktop || !item.shareUrl.isExpired) && <TimeCell time={item.shareUrl.expireTime} />}
                {item.shareUrl.isExpired ? expiredPart : null}
            </div>
        ) : (
            c('Label').t`Never`
        );
    }

    return (
        <TableCell className="m-0 w20" data-testid="column-share-expires">
            {expiration}
        </TableCell>
    );
};

export const ShareOptionsCell = ({ item }: { item: DriveItem }) => {
    const { activeShareId } = useActiveShare();

    return (
        <TableCell
            className="m-0 file-browser-list--icon-column file-browser-list--context-menu-column flex flex-align-items-center"
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
