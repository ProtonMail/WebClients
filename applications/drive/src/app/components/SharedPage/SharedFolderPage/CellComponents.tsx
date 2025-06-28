import { c } from 'ttag';

import { Avatar, Button, UserAvatar, UserAvatarSizeEnum } from '@proton/atoms';
import { FileIcon, Icon, TableCell } from '@proton/components';
import { isProtonDocsDocument } from '@proton/shared/lib/helpers/mimetype';
import clsx from '@proton/utils/clsx';

import usePublicToken from '../../../hooks/drive/usePublicToken';
import { useDownload, useDownloadScanFlag } from '../../../store';
import { Cells, HeaderCellsPresets } from '../../FileBrowser';
import { ContextMenuCell } from '../../FileBrowser/ListView/Cells';
import headerCells from '../../sections/FileBrowser/headerCells';
import { getLinkIconText } from '../../sections/FileBrowser/utils';
import type { PublicLink } from '../interface';

export function getHeaderLargeScreen(canWrite: boolean) {
    return [
        headerCells.checkbox,
        headerCells.name,
        ...(canWrite ? [headerCells.uploadedBy] : []),
        headerCells.size,
        {
            type: HeaderCellsPresets.Placeholder,
            props: {
                className: 'w-1/6',
            },
        },
        headerCells.placeholder,
    ];
}

export function getHeaderSmallScreen() {
    return [headerCells.checkbox, headerCells.name, headerCells.placeholder];
}

export function getContentLargeScreen(canWrite: boolean): React.FC<{ item: PublicLink }>[] {
    return [
        Cells.CheckboxCell,
        NameCell,
        ...(canWrite ? [UploadedByCell] : []),
        SizeCell,
        DownloadCell,
        ContextMenuCell,
    ];
}

export function getContentSmallScreen(): React.FC<{ item: PublicLink }>[] {
    return [Cells.CheckboxCell, NameCell, ContextMenuCell];
}

function NameCell({ item }: { item: PublicLink }) {
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
            <Cells.NameCell name={item.name} />
        </TableCell>
    );
}

function UploadedByCell({ item }: { item: PublicLink }) {
    const email = item.signatureEmail;
    return (
        <TableCell className="flex flex-nowrap items-center gap-2 m-0 w-1/5 color-weak" data-testid="column-shared-by">
            {email && <UserAvatar name={email} size={UserAvatarSizeEnum.Small} />}
            {!email && (
                <Avatar
                    color="weak"
                    className="min-w-custom max-w-custom max-h-custom"
                    style={{
                        '--min-w-custom': '1.75rem',
                        '--max-w-custom': '1.75rem',
                        '--max-h-custom': '1.75rem',
                    }}
                >
                    <Icon name="user" className="color-weak" />
                </Avatar>
            )}
            <span className="text-ellipsis hidden lg:inline">{email || c('Info').t`Anonymous`}</span>
        </TableCell>
    );
}

function SizeCell({ item }: { item: PublicLink }) {
    if (item.progress) {
        return (
            <TableCell className="m-0 flex flex-nowrap items-center w-1/10" data-testid="column-size">
                {item.progress.progress > 0 && (
                    <>
                        <Cells.SizeCell size={item.progress.progress} className="pr-11 md:pr-0" />/
                    </>
                )}
                {item.progress.total !== undefined ? (
                    <Cells.SizeCell size={item.progress.total} className="pr-11 md:pr-0" />
                ) : (
                    <span className="pr-11">--</span>
                )}
            </TableCell>
        );
    }

    return (
        <TableCell className="m-0 flex flex-nowrap w-1/10" data-testid="column-size">
            {item.isFile ? (
                <Cells.SizeCell size={item.size} className="pr-11 md:pr-0" />
            ) : (
                <span className="pr-11 md:pr-0">--</span>
            )}
        </TableCell>
    );
}

function DownloadCell({ item }: { item: PublicLink }) {
    const { token } = usePublicToken();
    const { download } = useDownload();
    const isDownloadScanEnabled = useDownloadScanFlag();

    const isCurrentInProgress = Boolean(item.progress);

    const handleClick = () => {
        void download([{ ...item, shareId: token }], { virusScan: isDownloadScanEnabled });
    };

    const className = clsx([
        'self-center my-auto ',
        'file-browser-list--download-button',
        'mouse:group-hover:opacity-100',
    ]);

    const hideDownload = isProtonDocsDocument(item.mimeType);

    return (
        <TableCell
            className="m-0 flex flex-nowrap justify-end file-browser-list--icon-column w-1/6"
            data-testid="column-size"
        >
            {hideDownload ? null : (
                <Button
                    className={className}
                    shape="ghost"
                    size="small"
                    onClick={handleClick}
                    loading={isCurrentInProgress}
                >
                    <span>{c('Action').t`Download`}</span>
                    {!isCurrentInProgress ? <Icon name="arrow-down-line" className="ml-2 md:hidden lg:inline" /> : null}
                </Button>
            )}
        </TableCell>
    );
}
