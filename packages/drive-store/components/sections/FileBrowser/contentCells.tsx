import { c } from 'ttag';

import { Avatar } from '@proton/atoms/Avatar';
import { Button } from '@proton/atoms/Button';
import { FileIcon, Icon, TableCell, useActiveBreakpoint, useContactEmails } from '@proton/components';
import { getInitials } from '@proton/shared/lib/helpers/string';
import clsx from '@proton/utils/clsx';

import useActiveShare from '../../../hooks/drive/useActiveShare';
import { useDriveSharingFlags } from '../../../store';
import { formatAccessCount } from '../../../utils/formatters';
import { Cells } from '../../FileBrowser';
import SignatureIcon from '../../SignatureIcon';
import type { DeviceItem } from '../Devices/Devices';
import type { DriveItem } from '../Drive/Drive';
import type { SharedLinkItem } from '../SharedLinks/SharedLinks';
import type { SharedWithMeItem } from '../SharedWithMe/SharedWithMe';
import type { TrashItem } from '../Trash/Trash';
import CopyLinkIcon from './CopyLinkIcon';
import ShareIcon from './ShareIcon';
import { getDeviceIconText, getLinkIconText } from './utils';

const { LocationCell: LocationCellBase, SizeCell: SizeCellBase, NameCell: NameCellBase, TimeCell } = Cells;

export const NameCell = ({ item }: { item: DriveItem | SharedLinkItem | SharedWithMeItem | TrashItem }) => {
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
                <FileIcon
                    mimeType={item.isFile ? item.mimeType : 'Folder'}
                    alt={iconText}
                    className="file-browser-list-item--icon mr-2"
                />
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
    const { isSharingInviteAvailable } = useDriveSharingFlags();

    return (
        <TableCell
            className="m-0 file-browser-list--icon-column file-browser-list--context-menu-column flex items-center"
            data-testid="column-share-options"
        >
            {isSharingInviteAvailable
                ? item.isShared &&
                  item.showLinkSharingModal && (
                      <ShareIcon
                          shareId={activeShareId}
                          linkId={item.linkId}
                          trashed={item.trashed}
                          showLinkSharingModal={item.showLinkSharingModal}
                          isAdmin={item.isAdmin}
                      />
                  )
                : item.shareUrl && (
                      <CopyLinkIcon
                          shareId={activeShareId}
                          linkId={item.linkId}
                          isExpired={Boolean(item.shareUrl?.isExpired)}
                          trashed={item.trashed}
                      />
                  )}
        </TableCell>
    );
};

export const SharedByCell = ({ item }: { item: SharedWithMeItem }) => {
    const [contactEmails] = useContactEmails();

    if (item.isBookmark) {
        return (
            <TableCell className="flex flex-nowrap items-center m-0 w-1/5" data-testid="column-shared-by">
                <>
                    <Avatar
                        color="weak"
                        className="mr-2 min-w-custom max-w-custom max-h-custom"
                        style={{
                            '--min-w-custom': '1.75rem',
                            '--max-w-custom': '1.75rem',
                            '--max-h-custom': '1.75rem',
                        }}
                    >
                        <Icon className="color-weak" name="globe" />
                    </Avatar>
                    <span className="text-ellipsis color-weak">{c('Info').t`Public link`}</span>
                </>
            </TableCell>
        );
    }
    const email = item.sharedBy;
    const contactEmail = contactEmails?.find((contactEmail) => contactEmail.Email === email);
    const displayName = email && contactEmails && contactEmail ? contactEmail.Name : email;
    return (
        <TableCell className="flex flex-nowrap items-center m-0 w-1/5" data-testid="column-shared-by">
            {displayName && (
                <>
                    <Avatar
                        color="weak"
                        className="mr-2 min-w-custom max-w-custom max-h-custom"
                        style={{
                            '--min-w-custom': '1.75rem',
                            '--max-w-custom': '1.75rem',
                            '--max-h-custom': '1.75rem',
                        }}
                    >
                        {getInitials(displayName)}
                    </Avatar>
                    <span className="text-ellipsis">{displayName}</span>
                </>
            )}
        </TableCell>
    );
};

export const SharedOnCell = ({ item }: { item: SharedWithMeItem }) => {
    const time = item.bookmarkDetails?.createTime || item.sharedOn;
    return (
        <TableCell className="flex items-center m-0 w-1/6" data-testid="column-share-created">
            {time && (
                <TimeCell
                    time={time}
                    options={item.isBookmark ? { month: 'long', day: 'numeric', year: 'numeric' } : undefined}
                    sameDayOptions={item.isBookmark ? { month: 'long', day: 'numeric', year: 'numeric' } : undefined}
                />
            )}
        </TableCell>
    );
};

export const AcceptOrRejectInviteCell = ({ item }: { item: SharedWithMeItem }) => {
    return (
        <TableCell
            className="flex flex-nowrap items-center m-0 file-browser-list-item--accept-decline-cell"
            data-testid="column-share-accept-reject"
        >
            {item.invitationDetails && item.acceptInvitation && (
                <div className="flex flex-nowrap">
                    <Button
                        loading={item.invitationDetails.isLocked}
                        disabled={item.invitationDetails.isLocked}
                        className="text-ellipsis"
                        color="norm"
                        shape="ghost"
                        size="small"
                        data-testid="share-accept-button"
                        onClick={async (e) => {
                            e.stopPropagation();
                            await item.acceptInvitation?.(item.invitationDetails?.invitation.invitationId!);
                        }}
                    >
                        <span className="file-browser-list-item--accept-decline-text">{c('Action').t`Accept`}</span>
                    </Button>
                    {!item.invitationDetails.isLocked && (
                        <>
                            <Button
                                className="text-ellipsis file-browser-list-item--decline"
                                color="norm"
                                shape="ghost"
                                size="small"
                                data-testid="share-decline-button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    void item.rejectInvitation?.(item.invitationDetails?.invitation.invitationId!);
                                }}
                            >
                                <span className="file-browser-list-item--accept-decline-text">{c('Action')
                                    .t`Decline`}</span>
                            </Button>
                        </>
                    )}
                </div>
            )}
        </TableCell>
    );
};
