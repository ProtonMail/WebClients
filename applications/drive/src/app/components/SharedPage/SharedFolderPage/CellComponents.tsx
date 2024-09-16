import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { FileIcon, Icon, TableCell, useActiveBreakpoint } from '@proton/components';
import { isProtonDocument } from '@proton/shared/lib/helpers/mimetype';
import clsx from '@proton/utils/clsx';

import usePublicToken from '../../../hooks/drive/usePublicToken';
import { useDownload } from '../../../store';
import { isTransferActive, isTransferPaused } from '../../../utils/transfer';
import { Cells, HeaderCellsPresets } from '../../FileBrowser';
import { getLinkIconText } from '../../sections/FileBrowser/utils';
import type { PublicLink } from '../interface';

export const headerCellsLargeScreen = [
    {
        type: HeaderCellsPresets.Checkbox,
    },
    {
        type: 'name',
        getText: () => c('Label').t`Name`,
        sorting: true,
    },
    {
        type: 'size',
        getText: () => c('Label').t`Size`,
        props: {
            className: 'w-custom text-right',
            style: { '--w-custom': '11em' },
        },
        sorting: true,
    },
    {
        type: HeaderCellsPresets.Placeholder,
        props: {
            className: 'w-custom',
            style: { '--w-custom': '23vw' },
        },
    },
];

export const headerCellsSmallScreen = [
    {
        type: HeaderCellsPresets.Checkbox,
    },
    {
        type: 'name',
        getText: () => c('Label').t`Name`,
        sorting: true,
    },
    {
        type: 'size',
        getText: () => c('Label').t`Size`,
        props: {
            className: 'w-custom text-right',
            style: { '--w-custom': '11em' },
        },
        sorting: true,
    },
    {
        type: HeaderCellsPresets.Placeholder,
        props: {
            className: 'w-custom',
            style: { '--w-custom': '2.75em' },
        },
    },
];
export const contentCellsLargeScreen: React.FC<{ item: PublicLink }>[] = [
    Cells.CheckboxCell,
    NameCell,
    SizeCell,
    DownloadCell,
];
export const contentCellsSmallScreen = contentCellsLargeScreen.slice(0, -1);

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

function SizeCell({ item }: { item: PublicLink }) {
    const { viewportWidth } = useActiveBreakpoint();

    if (item.progress) {
        return (
            <TableCell
                className="m-0 w-custom flex flex-nowrap justify-end items-center"
                style={{ '--w-custom': '11em' }}
                data-testid="column-size"
            >
                {!viewportWidth['<=small'] && item.progress.progress > 0 && (
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

    const styleValue = viewportWidth['<=small'] ? '6em' : '11em';

    return (
        <TableCell
            className="m-0 flex flex-nowrap md:justify-end w-custom"
            style={{ '--w-custom': styleValue }}
            data-testid="column-size"
        >
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
    const { download, downloads, clearDownloads } = useDownload();

    const isCurrentInProgress = Boolean(item.progress);

    const handleClick = () => {
        clearDownloads();

        void download([{ ...item, shareId: token }]);
    };

    const isAnyInProgress = downloads.some((transfer) => isTransferActive(transfer) || isTransferPaused(transfer));

    const className = clsx([
        'self-center my-auto ',
        'file-browser-list--download-button',
        'mouse:group-hover:opacity-100',
    ]);

    const hideDownload = isProtonDocument(item.mimeType);

    return (
        <TableCell
            className="m-0 flex flex-nowrap file-browser-list--icon-column w-custom"
            style={{ '--w-custom': '23vw' }}
            data-testid="column-size"
        >
            {hideDownload ? null : (
                <Button
                    className={className}
                    shape="ghost"
                    size="small"
                    onClick={handleClick}
                    loading={isCurrentInProgress}
                    disabled={isAnyInProgress && !isCurrentInProgress}
                >
                    <span>{c('Action').t`Download`}</span>
                    {!isCurrentInProgress ? <Icon name="arrow-down-line" className="ml-2" /> : null}
                </Button>
            )}
        </TableCell>
    );
}
