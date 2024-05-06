import { c } from 'ttag';

import { Avatar } from '@proton/atoms/Avatar';
import { FileIcon, Icon, TableCell, useActiveBreakpoint, useContactEmails } from '@proton/components';
import { getInitials } from '@proton/shared/lib/helpers/string';
import clsx from '@proton/utils/clsx';

import useActiveShare from '../../../hooks/drive/useActiveShare';
import { formatAccessCount } from '../../../utils/formatters';
import { Cells } from '../../FileBrowser';
import SignatureIcon from '../../SignatureIcon';
import { DeviceItem } from '../Devices/Devices';
import { DriveItem } from '../Drive/Drive';
import { SharedLinkItem } from '../SharedLinks/SharedLinks';
import { SharedWithMeItem } from '../SharedWithMe/SharedWithMe';
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
        <TableCell className="m-0 flex items-center flex-nowrap flex-1" data-testid="column-name">
            {item.cachedThumbnailUrl ? (
                <img
                    src={item.cachedThumbnailUrl}
                    alt={iconText}
                    className="file-browser-list-item--thumbnail shrink-0 mr-2"
                />
            ) : (
                <FileIcon mimeType={item.isFile ? item.mimeType : 'Folder'} alt={iconText} className="mr-2" />
            )}
            <SignatureIcon signatureIssues={item.signatureIssues} isFile={item.isFile} className="mr-2 shrink-0" />
            <NameCellBase name={item.name} />
        </TableCell>
    );
};

export const DeviceNameCell = ({ item }: { item: DeviceItem }) => {
    const iconText = getDeviceIconText(item.name);

    return (
        <TableCell
            className="m-0 flex items-center flex-nowrap flex-1 filebrowser-list-device-name-cell"
            data-testid="column-name"
        >
            <Icon name="tv" alt={iconText} className="mr-2" />
            <NameCellBase name={item.name} />
        </TableCell>
    );
};

export const ModifiedCell = ({ item }: { item: DriveItem }) => {
    return (
        <TableCell className="flex items-center m-0 w-1/6" data-testid="column-modified">
            <TimeCell time={item.fileModifyTime} />
        </TableCell>
    );
};

export const ModifiedCellDevice = ({ item }: { item: DeviceItem }) => {
    return (
        <TableCell className="flex items-center m-0 w-1/6" data-testid="column-modified">
            <TimeCell time={item.modificationTime} />
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

export const DeletedCell = ({ item }: { item: TrashItem }) => {
    return (
        <TableCell className="flex items-center m-0 w-1/4" data-testid="column-trashed">
            <TimeCell time={item.trashed || item.fileModifyTime} />
        </TableCell>
    );
};

export const CreatedCell = ({ item }: { item: TrashItem | SharedLinkItem }) => {
    const time = item.shareUrl?.createTime || item.sharedOn;
    return (
        <TableCell className="flex items-center m-0 w-1/6" data-testid="column-share-created">
            {time && <TimeCell time={time} />}
        </TableCell>
    );
};

export const LocationCell = ({ item }: { item: TrashItem | SharedLinkItem }) => {
    const { viewportWidth } = useActiveBreakpoint();
    const shareId = item.rootShareId;

    return (
        <TableCell
            className={`flex items-center ${clsx(['m-0', viewportWidth['>=large'] ? 'w-1/5' : 'w-1/4'])}`}
            data-testid="column-location"
        >
            <LocationCellBase shareId={shareId} parentLinkId={item.parentLinkId} />
        </TableCell>
    );
};

export const AccessCountCell = ({ item }: { item: TrashItem }) => {
    return (
        <TableCell className="flex items-center m-0 w-1/6" data-testid="column-num-accesses">
            {formatAccessCount(item.shareUrl?.numAccesses)}
        </TableCell>
    );
};

export const ExpirationCell = ({ item }: { item: TrashItem }) => {
    const { viewportWidth } = useActiveBreakpoint();

    const expiredPart = viewportWidth['>=large'] ? (
        <span className="ml-1">{c('Label').t`(Expired)`}</span>
    ) : (
        <span>{c('Label').t`Expired`}</span>
    );

    let expiration;
    if (item.shareUrl) {
        expiration = item.shareUrl.expireTime ? (
            <div className="flex flex-nowrap">
                {(viewportWidth['>=large'] || !item.shareUrl.isExpired) && <TimeCell time={item.shareUrl.expireTime} />}
                {item.shareUrl.isExpired ? expiredPart : null}
            </div>
        ) : (
            c('Label').t`Never`
        );
    }

    return (
        <TableCell className="flex items-center m-0 w-1/5" data-testid="column-share-expires">
            {expiration}
        </TableCell>
    );
};

export const ShareOptionsCell = ({ item }: { item: DriveItem }) => {
    const { activeShareId } = useActiveShare();

    return (
        <TableCell
            className="m-0 file-browser-list--icon-column file-browser-list--context-menu-column flex items-center"
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

export const SharedByCell = ({ item }: { item: SharedWithMeItem }) => {
    const [contactEmails] = useContactEmails();

    const email = item.sharedBy;
    const contactEmail = contactEmails?.find((contactEmail) => contactEmail.Email === email);
    const displayName = email && contactEmails && contactEmail ? contactEmail.Name : email;
    return (
        <TableCell className="flex flex-nowrap items-center m-0 w-1/5" data-testid="column-shared-by">
            <Avatar
                color="weak"
                className="mr-2 min-w-custom max-w-custom max-h-custom"
                style={{ '--min-w-custom': '1.75rem', '--max-w-custom': '1.75rem', '--max-h-custom': '1.75rem' }}
            >
                {getInitials(displayName)}
            </Avatar>
            <span className="text-ellipsis">{displayName}</span>
        </TableCell>
    );
};

export const SharedOnCell = ({ item }: { item: SharedWithMeItem }) => {
    return (
        <TableCell className="flex items-center m-0 w-1/6" data-testid="column-share-created">
            {item.sharedOn && <TimeCell time={item.sharedOn} />}
        </TableCell>
    );
};
